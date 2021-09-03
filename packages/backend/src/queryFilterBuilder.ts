import {
    DimensionType,
    Explore,
    fieldId,
    formatDate,
    formatTimestamp,
    getDimensions,
} from 'common';

export enum RelationalOperator {
    EQUAL = 'equals',
    NOT_EQUALS = 'notEquals',
    STARTS_WITH = 'startsWith',
    NULL = 'isNull',
    NOT_NULL = 'notNull',
    LESS_THAN = 'lessThan',
    LESS_THAN_OR_EQUAL = 'lessThanOrEqual',
    GREATER_THAN = 'greaterThan',
    GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual',
}

export enum LogicalOperator {
    AND = 'AND',
    OR = 'OR',
}

export interface GroupFilter {
    children: Array<GroupFilter | Filter>;
    groupOperator: LogicalOperator;
}

export interface FilterBase<T = any> {
    tableName: string;
    fieldName: string;
    operator: RelationalOperator;
    values?: T[];
}

export interface FilterWithValues<T, O extends RelationalOperator>
    extends FilterBase<T> {
    operator: O;
    values: T[];
}

export interface FilterWithNoValues<O extends RelationalOperator>
    extends FilterBase {
    operator: O;
}

export type StringFilter =
    | FilterWithValues<
          string,
          | RelationalOperator.EQUAL
          | RelationalOperator.NOT_EQUALS
          | RelationalOperator.STARTS_WITH
      >
    | FilterWithNoValues<RelationalOperator.NULL | RelationalOperator.NOT_NULL>;

export type NumberFilter =
    | FilterWithValues<
          number,
          | RelationalOperator.EQUAL
          | RelationalOperator.NOT_EQUALS
          | RelationalOperator.GREATER_THAN
          | RelationalOperator.LESS_THAN
      >
    | FilterWithNoValues<RelationalOperator.NULL | RelationalOperator.NOT_NULL>;

export type DateAndTimestampFilter =
    | FilterWithValues<
          Date,
          | RelationalOperator.EQUAL
          | RelationalOperator.NOT_EQUALS
          | RelationalOperator.GREATER_THAN
          | RelationalOperator.GREATER_THAN_OR_EQUAL
          | RelationalOperator.LESS_THAN
          | RelationalOperator.LESS_THAN_OR_EQUAL
      >
    | FilterWithNoValues<RelationalOperator.NULL | RelationalOperator.NOT_NULL>;

type Filter = StringFilter | NumberFilter | DateAndTimestampFilter;

export const isGroupFilter = (
    value: GroupFilter | Filter,
): value is GroupFilter =>
    Object.prototype.hasOwnProperty.call(value, 'children');

export const fieldIdFromFilter = (filter: Filter) =>
    `${filter.tableName}_${filter.fieldName}`;

export class FilterBuilder {
    private readonly rootGroupFilter: GroupFilter;

    private readonly explore: Explore;

    constructor(rootGroupFilter: GroupFilter, explore: Explore) {
        this.rootGroupFilter = rootGroupFilter;
        this.explore = explore;
    }

    public generateWhereClause(): string {
        return this.rootGroupFilter.children.length > 0
            ? `WHERE ${this.generateGroupFilter(this.rootGroupFilter)}`
            : '';
    }

    private generateGroupFilter(groupFilter: GroupFilter): string {
        const filters = groupFilter.children.reduce(
            (acc, value, index) =>
                isGroupFilter(value)
                    ? `${acc} ${this.generateGroupFilter(value)} ${
                          index === groupFilter.children.length
                              ? ` ${groupFilter.groupOperator} `
                              : ''
                      }`
                    : `${acc} ${this.generateFilterSql(value)}`,
            '',
        );
        return `(${filters})`;
    }

    private generateFilterSql(filter: Filter): string {
        const filterFieldId = fieldIdFromFilter(filter);
        const dimension = getDimensions(this.explore).find(
            (d) => fieldId(d) === filterFieldId,
        );
        if (!dimension) {
            // TODO
            throw new Error(`Error ...`);
        }
        switch (dimension.type) {
            case DimensionType.STRING:
                return FilterBuilder.renderStringFilterSql(
                    dimension.compiledSql,
                    filter as StringFilter,
                );
            case DimensionType.NUMBER:
                return FilterBuilder.renderNumberFilterSql(
                    dimension.compiledSql,
                    filter as NumberFilter,
                );
            case DimensionType.DATE:
                return FilterBuilder.renderDateFilterSql(
                    dimension.compiledSql,
                    filter as DateAndTimestampFilter,
                );
            case DimensionType.TIMESTAMP:
                return FilterBuilder.renderDateFilterSql(
                    dimension.compiledSql,
                    filter as DateAndTimestampFilter,
                    formatTimestamp,
                );
            case DimensionType.BOOLEAN:
                // TODO
                return '';
            default:
                const nope: never = dimension.type;
                // TODO
                throw Error(
                    `No function implemented to render sql for filter group type ...`,
                );
        }
    }

    static renderStringFilterSql(
        targetSql: string,
        filter: StringFilter,
    ): string {
        switch (filter.operator) {
            case RelationalOperator.EQUAL:
                return filter.values.length === 0
                    ? 'false'
                    : `(${targetSql}) IN (${filter.values
                          .map((v) => `'${v}'`)
                          .join(',')})`;
            case RelationalOperator.NOT_EQUALS:
                return filter.values.length === 0
                    ? 'true'
                    : `(${targetSql}) NOT IN (${filter.values
                          .map((v) => `'${v}'`)
                          .join(',')})`;
            case RelationalOperator.NULL:
                return `(${targetSql}) IS NULL`;
            case RelationalOperator.NOT_NULL:
                return `(${targetSql}) IS NOT NULL`;
            case RelationalOperator.STARTS_WITH:
                return `(${targetSql}) LIKE '${filter.values[0]}%'`;
            default:
                const { operator } = filter;
                const nope: never = filter;
                throw Error(
                    `No function implemented to render sql for filter type ${operator} on dimension of number type`,
                );
        }
    }

    static renderNumberFilterSql(
        targetSql: string,
        filter: NumberFilter,
    ): string {
        switch (filter.operator) {
            case RelationalOperator.EQUAL:
                return filter.values.length === 0
                    ? 'false'
                    : `(${targetSql}) IN (${filter.values.join(',')})`;
            case RelationalOperator.NOT_EQUALS:
                return filter.values.length === 0
                    ? 'true'
                    : `(${targetSql}) NOT IN (${filter.values.join(',')})`;
            case RelationalOperator.NULL:
                return `(${targetSql}) IS NULL`;
            case RelationalOperator.NOT_NULL:
                return `(${targetSql}) IS NOT NULL`;
            case RelationalOperator.GREATER_THAN:
                return `(${targetSql}) > ${filter.values[0]}`;
            case RelationalOperator.LESS_THAN:
                return `(${targetSql}) < ${filter.values[0]}`;
            default:
                const { operator } = filter;
                const nope: never = filter;
                throw Error(
                    `No function implemented to render sql for filter type ${operator} on dimension of string type`,
                );
        }
    }

    static renderDateFilterSql(
        targetSql: string,
        filter: DateAndTimestampFilter,
        dateFormatter = formatDate,
    ): string {
        switch (filter.operator) {
            case RelationalOperator.EQUAL:
                return `(${targetSql}) = ('${dateFormatter(
                    filter.values[0],
                )}')`;
            case RelationalOperator.NOT_EQUALS:
                return `(${targetSql}) != ('${dateFormatter(
                    filter.values[0],
                )}')`;
            case RelationalOperator.NULL:
                return `(${targetSql}) IS NULL`;
            case RelationalOperator.NOT_NULL:
                return `(${targetSql}) IS NOT NULL`;
            case RelationalOperator.GREATER_THAN:
                return `(${targetSql}) > ('${dateFormatter(
                    filter.values[0],
                )}')`;
            case RelationalOperator.GREATER_THAN_OR_EQUAL:
                return `(${targetSql}) >= ('${dateFormatter(
                    filter.values[0],
                )}')`;
            case RelationalOperator.LESS_THAN:
                return `(${targetSql}) < ('${dateFormatter(
                    filter.values[0],
                )}')`;
            case RelationalOperator.LESS_THAN_OR_EQUAL:
                return `(${targetSql}) <= ('${dateFormatter(
                    filter.values[0],
                )}')`;
            default:
                const { operator } = filter;
                const nope: never = filter;
                throw Error(
                    `No function implemented to render sql for filter type ${operator} on dimension of string type`,
                );
        }
    }
}
