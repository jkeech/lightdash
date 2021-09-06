import {
    CompiledMetricQuery,
    DimensionType,
    Explore,
    FieldType,
    LogicalOperator,
    MetricType,
    RelationalOperator,
} from 'common';

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
    filters: {
        children: [],
        groupOperator: LogicalOperator.AND,
    },
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
    filters: {
        children: [
            {
                children: [
                    {
                        type: DimensionType.NUMBER,
                        tableName: 'table1',
                        fieldName: 'dim1',
                        operator: RelationalOperator.EQUAL,
                        values: [1, 2],
                    },
                    {
                        type: DimensionType.NUMBER,
                        tableName: 'table1',
                        fieldName: 'dim1',
                        operator: RelationalOperator.NOT_NULL,
                    },
                ],
                groupOperator: LogicalOperator.AND,
            },
            {
                children: [
                    {
                        type: DimensionType.STRING,
                        tableName: 'table1',
                        fieldName: 'dim2',
                        operator: RelationalOperator.EQUAL,
                        values: ['test', 'test2'],
                    },
                    {
                        type: DimensionType.STRING,
                        tableName: 'table1',
                        fieldName: 'dim2',
                        operator: RelationalOperator.NULL,
                    },
                ],
                groupOperator: LogicalOperator.OR,
            },
        ],
        groupOperator: LogicalOperator.AND,
    },
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
  (
    (table1.dim1) IN (1,2)
    AND (table1.dim1) IS NOT NULL
  )
  AND (
    (table1.dim2) IN ('test','test2')
    OR (table1.dim2) IS NULL
  )
)
GROUP BY 1,2
)
SELECT
  *,
  table1_dim1 + table1_metric1 AS \`calc3\`
FROM metrics
ORDER BY table1_metric1 DESC
LIMIT 10`;
