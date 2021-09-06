import {
    CompiledMetricQuery,
    Explore,
    fieldId,
    FieldId,
    getDimensions,
    getMetrics,
} from 'common';
import { FilterBuilder } from './queryFilterBuilder';

const getDimensionFromId = (dimId: FieldId, explore: Explore) => {
    const dimensions = getDimensions(explore);
    const dimension = dimensions.find((d) => fieldId(d) === dimId);
    if (dimension === undefined)
        throw new Error(
            `Tried to reference dimension with unknown field id: ${dimId}`,
        );
    return dimension;
};

const getMetricFromId = (metricId: FieldId, explore: Explore) => {
    const metrics = getMetrics(explore);
    const metric = metrics.find((m) => fieldId(m) === metricId);
    if (metric === undefined)
        throw new Error(
            `Tried to reference metric with unknown field id ${metricId}`,
        );
    return metric;
};

const getQuoteChar = (quotedExample: string): string => {
    const char = quotedExample.slice(0, 1);
    switch (char) {
        case '"':
            return '"';
        default:
            return '`';
    }
};

export type BuildQueryProps = {
    explore: Explore;
    compiledMetricQuery: CompiledMetricQuery;
};
export const buildQuery = ({
    explore,
    compiledMetricQuery,
}: BuildQueryProps) => {
    const { dimensions, metrics, filters, sorts, limit } = compiledMetricQuery;
    const baseTable = explore.tables[explore.baseTable].sqlTable;
    const sqlFrom = `FROM ${baseTable} AS ${explore.baseTable}`;
    const q = getQuoteChar(baseTable); // quote char

    const sqlJoins = explore.joinedTables
        .map((join) => {
            const joinTable = explore.tables[join.table].sqlTable;
            const alias = join.table;
            return `LEFT JOIN ${joinTable} AS ${alias}\n  ON ${join.compiledSqlOn}`;
        })
        .join('\n');

    const dimensionSelects = dimensions.map((field) => {
        const alias = field;
        const dimension = getDimensionFromId(field, explore);
        return `  ${dimension.compiledSql} AS ${q}${alias}${q}`;
    });

    const metricSelects = metrics.map((field) => {
        const alias = field;
        const metric = getMetricFromId(field, explore);
        return `  ${metric.compiledSql} AS ${q}${alias}${q}`;
    });

    const sqlSelect = `SELECT\n${[...dimensionSelects, ...metricSelects].join(
        ',\n',
    )}`;
    const sqlGroupBy =
        dimensionSelects.length > 0
            ? `GROUP BY ${dimensionSelects.map((val, i) => i + 1).join(',')}`
            : '';

    const fieldOrders = sorts.map(
        (sort) => `${sort.fieldId}${sort.descending ? ' DESC' : ''}`,
    );
    const sqlOrderBy =
        fieldOrders.length > 0 ? `ORDER BY ${fieldOrders.join(', ')}` : '';

    const sqlWhere = new FilterBuilder(
        filters as any,
        explore,
    ).generateWhereClause();

    const sqlLimit = `LIMIT ${limit}`;

    if (compiledMetricQuery.compiledTableCalculations.length > 0) {
        const cteSql = [
            sqlSelect,
            sqlFrom,
            sqlJoins,
            sqlWhere,
            sqlGroupBy,
        ].join('\n');
        const cteName = 'metrics';
        const cte = `WITH ${cteName} AS (\n${cteSql}\n)`;
        const tableCalculationSelects =
            compiledMetricQuery.compiledTableCalculations.map(
                (tableCalculation) => {
                    const alias = tableCalculation.name;
                    return `${tableCalculation.compiledSql} AS ${q}${alias}${q}`;
                },
            );
        const finalSelect = `SELECT\n  *,\n  ${tableCalculationSelects.join(
            ',\n  ',
        )}`;
        const finalFrom = `FROM ${cteName}`;
        return [cte, finalSelect, finalFrom, sqlOrderBy, sqlLimit].join('\n');
    }

    const metricQuerySql = [
        sqlSelect,
        sqlFrom,
        sqlJoins,
        sqlWhere,
        sqlGroupBy,
        sqlOrderBy,
        sqlLimit,
    ].join('\n');
    return metricQuerySql;
};
