import { Knex } from 'knex';
import { LogicalOperator } from 'common';

export enum FilterGroupOperator {
    and = 'and',
    or = 'or',
}

export type StringFilterGroup = {
    type: 'string';
    tableName: string;
    fieldName: string;
    operator: FilterGroupOperator;
    filters: StringFilter[];
};

export type StringFilter =
    | { operator: 'equals'; values: string[]; id?: string }
    | { operator: 'notEquals'; values: string[]; id?: string }
    | { operator: 'startsWith'; value: string; id?: string }
    | { operator: 'isNull'; id?: string }
    | { operator: 'notNull'; id?: string };

export type NumberFilterGroup = {
    type: 'number';
    tableName: string;
    fieldName: string;
    operator: FilterGroupOperator;
    filters: NumberFilter[];
};

export type NumberFilter =
    | { operator: 'equals'; values: number[]; id?: string }
    | { operator: 'notEquals'; values: number[]; id?: string }
    | { operator: 'greaterThan'; value: number; id?: string }
    | { operator: 'lessThan'; value: number; id?: string }
    | { operator: 'isNull'; id?: string }
    | { operator: 'notNull'; id?: string };

export type DateFilterGroup = {
    type: 'date';
    tableName: string;
    fieldName: string;
    operator: FilterGroupOperator;
    filters: DateAndTimestampFilter[];
};

export type TimestampFilterGroup = {
    type: 'timestamp';
    tableName: string;
    fieldName: string;
    operator: FilterGroupOperator;
    filters: DateAndTimestampFilter[];
};

export type DateAndTimestampFilter =
    | { operator: 'equals'; value: Date; id?: string }
    | { operator: 'notEquals'; value: Date; id?: string }
    | { operator: 'greaterThan'; value: Date; id?: string }
    | { operator: 'greaterThanOrEqual'; value: Date; id?: string }
    | { operator: 'lessThan'; value: Date; id?: string }
    | { operator: 'lessThanOrEqual'; value: Date; id?: string }
    | { operator: 'isNull'; id?: string }
    | { operator: 'notNull'; id?: string };

export type FilterGroup =
    | StringFilterGroup
    | NumberFilterGroup
    | TimestampFilterGroup
    | DateFilterGroup;

const SAVED_QUERY_VERSION_TABLE_NAME = 'saved_queries_versions';

const getVersions = async (
    knex: Knex,
): Promise<{ saved_queries_version_id: string; filters: any }[]> =>
    knex(SAVED_QUERY_VERSION_TABLE_NAME).select([
        'saved_queries_version_id',
        'filters',
    ]);

function reformatOld(old: FilterGroup[]): any {
    return {
        children: old.reduce<any[]>(
            (acc, { type, tableName, fieldName, filters }) => {
                const newFilters = filters.map((filter) => {
                    // @ts-ignore
                    const { values, value } = filter;
                    return {
                        id: filter.id,
                        type,
                        tableName,
                        fieldName,
                        operator: filter.operator,
                        values: values || (value !== undefined ? [value] : []),
                    };
                });
                return [...acc, ...newFilters];
            },
            [],
        ),
        groupOperator: LogicalOperator.AND,
    };
}

export async function up(knex: Knex): Promise<void> {
    if (await knex.schema.hasTable(SAVED_QUERY_VERSION_TABLE_NAME)) {
        const results = await getVersions(knex);
        const promises: Promise<any>[] = [];
        results.forEach((version) => {
            promises.push(
                knex(SAVED_QUERY_VERSION_TABLE_NAME)
                    .update({
                        filters: JSON.stringify(reformatOld(version.filters)),
                    })
                    .where(
                        'saved_queries_version_id',
                        version.saved_queries_version_id,
                    ),
            );
        });
        await Promise.all(promises);
    }
}

function reformatToOld(old: any): FilterGroup[] {
    if (old.children.length <= 0) {
        return [];
    }
    return Object.values(
        old.children.reduce(
            (
                acc: Record<string, FilterGroup>,
                { tableName, fieldName, type, id, values, operator }: any,
            ) => {
                const fieldId = tableName + fieldName;
                if (!acc[fieldId]) {
                    acc[fieldId] = {
                        type,
                        tableName,
                        fieldName,
                        operator: FilterGroupOperator.and,
                        filters: [],
                    };
                }
                const newFilter = {
                    id,
                    operator,
                };
                if (
                    ['date', 'timestamp'].includes(type) ||
                    ['startsWith', 'greaterThan', 'lessThan'].includes(operator)
                ) {
                    // @ts-ignore
                    // eslint-disable-next-line prefer-destructuring
                    newFilter.value = values[0];
                } else if (
                    ['string', 'number'].includes(type) &&
                    ['equals', 'notEquals'].includes(operator)
                ) {
                    // @ts-ignore
                    // eslint-disable-next-line prefer-destructuring
                    newFilter.values = values;
                }

                acc[fieldId].filters.push(newFilter);
                return acc;
            },
            {},
        ),
    );
}

export async function down(knex: Knex): Promise<void> {
    if (await knex.schema.hasTable(SAVED_QUERY_VERSION_TABLE_NAME)) {
        const results = await getVersions(knex);
        const promises: Promise<any>[] = [];
        results.forEach((version) => {
            promises.push(
                knex(SAVED_QUERY_VERSION_TABLE_NAME)
                    .update({
                        filters: JSON.stringify(reformatToOld(version.filters)),
                    })
                    .where(
                        'saved_queries_version_id',
                        version.saved_queries_version_id,
                    ),
            );
        });

        await Promise.all(promises);
    }
}
