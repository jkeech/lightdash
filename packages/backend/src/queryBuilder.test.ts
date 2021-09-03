import { buildQuery } from './queryBuilder';
import {
    EXPLORE,
    METRIC_QUERY,
    METRIC_QUERY_SQL,
    METRIC_QUERY_WITH_FILTERS,
    METRIC_QUERY_WITH_FILTERS_SQL,
} from './queryBuilder.mock';

test('Should build simple metric query', () => {
    expect(
        buildQuery({
            explore: EXPLORE,
            compiledMetricQuery: METRIC_QUERY,
        }),
    ).toStrictEqual(METRIC_QUERY_SQL);
});

test('Should build metric query with filters', () => {
    expect(
        buildQuery({
            explore: EXPLORE,
            compiledMetricQuery: METRIC_QUERY_WITH_FILTERS,
        }),
    ).toStrictEqual(METRIC_QUERY_WITH_FILTERS_SQL);
});
