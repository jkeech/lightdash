import {
    DimensionType,
    Explore,
    fieldId,
    formatDate,
    formatTimestamp,
    getDimensions,
    GroupFilter,
    Filter,
    isGroupFilter,
    StringFilter,
    NumberFilter,
    DateAndTimestampFilter,
    RelationalOperator,
} from 'common';

const TabSpace = '  ';

const fieldIdFromFilter = (filter: Filter) =>
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

    private generateGroupFilter(
        groupFilter: GroupFilter,
        depth: number = 1,
    ): string {
        const groupTab = Array(depth).join(TabSpace);
        const contentTab = Array(depth + 1).join(TabSpace);
        const groupFilterLines = groupFilter.children.map((value, index) => {
            const operator = index > 0 ? `${groupFilter.groupOperator} ` : '';
            const line = isGroupFilter(value)
                ? this.generateGroupFilter(value, depth + 1)
                : this.generateFilterSql(value);
            return `${contentTab}${operator}${line}`;
        }, '');
        return `(\n${groupFilterLines.join('\n')}\n${groupTab})`;
    }

    private generateFilterSql(filter: Filter): string {
        const filterFieldId = fieldIdFromFilter(filter);
        const dimension = getDimensions(this.explore).find(
            (d) => fieldId(d) === filterFieldId,
        );
        if (!dimension) {
            throw new Error(
                `Filter references dimension ${filterFieldId} but it wasn't found`,
            );
        }
        switch (filter.type) {
            case DimensionType.STRING:
                return FilterBuilder.renderStringFilterSql(
                    dimension.compiledSql,
                    filter,
                );
            case DimensionType.NUMBER:
                return FilterBuilder.renderNumberFilterSql(
                    dimension.compiledSql,
                    filter,
                );
            case DimensionType.DATE:
                return FilterBuilder.renderDateFilterSql(
                    dimension.compiledSql,
                    filter,
                );
            case DimensionType.TIMESTAMP:
                return FilterBuilder.renderDateFilterSql(
                    dimension.compiledSql,
                    filter,
                    formatTimestamp,
                );
            case DimensionType.BOOLEAN:
                // TODO: handle boolean dimensions
                return '';
            default:
                const { type } = filter;
                const nope: never = filter;
                throw Error(
                    `No function implemented to render sql for filter group type ${type}`,
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
                const nope: never = filter.operator;
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
                const nope: never = filter.operator;
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
                const nope: never = filter.operator;
                throw Error(
                    `No function implemented to render sql for filter type ${operator} on dimension of string type`,
                );
        }
    }
}
