import {
    CompiledMetricQuery,
    DimensionType,
    Explore,
    FieldType,
    FilterGroupOperator,
    MetricType,
} from 'common';
import {
    GroupFilter,
    LogicalOperator,
    RelationalOperator,
} from './queryFilterBuilder';

export const EXPLORE: Explore = {
    name: 'table1',
    baseTable: 'table1',
    joinedTables: [],
    tables: {
        table1: {
            name: 'table1',
            sqlTable: '`db`.`schema`.`table1`',
            dimensions: {
                dim1: {
                    type: DimensionType.NUMBER,
                    name: 'dim1',
                    table: 'table1',
                    fieldType: FieldType.DIMENSION,
                    sql: '${TABLE}.dim1',
                    compiledSql: 'table1.dim1',
                },
                dim2: {
                    type: DimensionType.STRING,
                    name: 'dim2',
                    table: 'table1',
                    fieldType: FieldType.DIMENSION,
                    sql: '${TABLE}.dim2',
                    compiledSql: 'table1.dim2',
                },
            },
            metrics: {
                metric1: {
                    type: MetricType.MAX,
                    fieldType: FieldType.METRIC,
                    table: 'table1',
                    name: 'metric1',
                    sql: '${TABLE}.number_column',
                    compiledSql: 'MAX(table1.number_column)',
                },
            },
            lineageGraph: {},
        },
    },
};

export const METRIC_QUERY: CompiledMetricQuery = {
    dimensions: ['table1_dim1'],
    metrics: ['table1_metric1'],
    filters: [],
    sorts: [{ fieldId: 'table1_metric1', descending: true }],
    limit: 10,
    tableCalculations: [
        {
            name: 'calc3',
            displayName: '',
            sql: '${table1.dim1} + ${table1.metric1}',
        },
    ],
    compiledTableCalculations: [
        {
            name: 'calc3',
            displayName: '',
            sql: '${table1.dim1} + ${table1.metric1}',
            compiledSql: 'table1_dim1 + table1_metric1',
        },
    ],
};

export const METRIC_QUERY_SQL = `WITH metrics AS (
SELECT
  table1.dim1 AS \`table1_dim1\`,
  MAX(table1.number_column) AS \`table1_metric1\`
FROM \`db\`.\`schema\`.\`table1\` AS table1


GROUP BY 1
)
SELECT
  *,
  table1_dim1 + table1_metric1 AS \`calc3\`
FROM metrics
ORDER BY table1_metric1 DESC
LIMIT 10`;

export const METRIC_QUERY_WITH_FILTERS: CompiledMetricQuery = {
    dimensions: ['table1_dim1', 'table1_dim2'],
    metrics: ['table1_metric1'],
    filters: [
        {
            type: 'number',
            tableName: 'table1',
            fieldName: 'dim1',
            operator: FilterGroupOperator.and,
            filters: [
                {
                    values: [1, 2],
                    operator: 'equals',
                },
                {
                    operator: 'notNull',
                },
            ],
        },
        {
            type: 'string',
            tableName: 'table1',
            fieldName: 'dim2',
            operator: FilterGroupOperator.or,
            filters: [
                {
                    values: ['test', 'test2'],
                    operator: 'equals',
                },
                {
                    operator: 'isNull',
                },
            ],
        },
    ],
    sorts: [{ fieldId: 'table1_metric1', descending: true }],
    limit: 10,
    tableCalculations: [
        {
            name: 'calc3',
            displayName: '',
            sql: '${table1.dim1} + ${table1.metric1}',
        },
    ],
    compiledTableCalculations: [
        {
            name: 'calc3',
            displayName: '',
            sql: '${table1.dim1} + ${table1.metric1}',
            compiledSql: 'table1_dim1 + table1_metric1',
        },
    ],
};

export const METRIC_QUERY_WITH_FILTERS_SQL = `WITH metrics AS (
SELECT
  table1.dim1 AS \`table1_dim1\`,
  table1.dim2 AS \`table1_dim2\`,
  MAX(table1.number_column) AS \`table1_metric1\`
FROM \`db\`.\`schema\`.\`table1\` AS table1

WHERE (
  (table1.dim1) IN (1,2)
   AND (table1.dim1) IS NOT NULL
) AND (
  (table1.dim2) IN ('test','test2')
   OR (table1.dim2) IS NULL
)
GROUP BY 1,2
)
SELECT
  *,
  table1_dim1 + table1_metric1 AS \`calc3\`
FROM metrics
ORDER BY table1_metric1 DESC
LIMIT 10`;

// const value2: GroupCondition = {
//     children: [
//         {
//             children: [
//                 {
//                     fieldRef: 'table_name.field_name',
//                     values: ['test'],
//                     chainOperator: 'AND',
//                     operator: '=',
//                 },
//                 {
//                     fieldRef: 'table_name.field_name2',
//                     values: [900],
//                     operator: '<>',
//                 },
//             ],
//             chainOperator: 'OR',
//         },
//         {
//             children: [
//                 {
//                     fieldRef: 'table_name.field_name2',
//                     values: [100],
//                     operator: '=',
//                 },
//             ],
//         },
//     ],
// };

export const METRIC_QUERY_WITH_FILTERS2: CompiledMetricQuery = {
    dimensions: ['table1_dim1', 'table1_dim2'],
    metrics: ['table1_metric1'],
    filters: {
        children: [
            {
                children: [
                    {
                        tableName: 'table1',
                        fieldName: 'dim1',
                        operator: RelationalOperator.EQUAL,
                        values: [1, 2],
                    },
                ],
                groupOperator: LogicalOperator.AND,
            },
            {
                children: [],
                groupOperator: LogicalOperator.OR,
            },
        ],
        groupOperator: LogicalOperator.AND,
    } as GroupFilter,
    sorts: [{ fieldId: 'table1_metric1', descending: true }],
    limit: 10,
    tableCalculations: [
        {
            name: 'calc3',
            displayName: '',
            sql: '${table1.dim1} + ${table1.metric1}',
        },
    ],
    compiledTableCalculations: [
        {
            name: 'calc3',
            displayName: '',
            sql: '${table1.dim1} + ${table1.metric1}',
            compiledSql: 'table1_dim1 + table1_metric1',
        },
    ],
};

export const METRIC_QUERY_WITH_FILTERS_SQL2 = `WITH metrics AS (
SELECT
  table1.dim1 AS \`table1_dim1\`,
  table1.dim2 AS \`table1_dim2\`,
  MAX(table1.number_column) AS \`table1_metric1\`
FROM \`db\`.\`schema\`.\`table1\` AS table1

WHERE (
  (table1.dim1) IN (1,2)
   AND (table1.dim1) IS NOT NULL
) AND (
  (table1.dim2) IN ('test','test2')
   OR (table1.dim2) IS NULL
)
GROUP BY 1,2
)
SELECT
  *,
  table1_dim1 + table1_metric1 AS \`calc3\`
FROM metrics
ORDER BY table1_metric1 DESC
LIMIT 10`;
