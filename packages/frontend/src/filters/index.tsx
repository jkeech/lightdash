import React, { useState } from 'react';
import {
    Query,
    Builder,
    Utils as QbUtils,
    JsonGroup,
    Config,
    ImmutableTree,
    BuilderProps,
    BasicConfig,
    SimpleField,
} from 'react-awesome-query-builder';

import 'react-awesome-query-builder/lib/css/styles.css';
import 'react-awesome-query-builder/lib/css/compact_styles.css';
import {
    Dimension,
    DimensionType,
    friendlyName,
    getDimensions,
    getFieldRef,
} from 'common';
import { useExplorer } from '../providers/ExplorerProvider';
import { useTable } from '../hooks/useTable';

// You need to provide your own config. See below 'Config format'
const config2: Config = {
    ...BasicConfig,
    fields: {
        qty: {
            label: 'Qty',
            type: 'number',
            fieldSettings: {
                min: 0,
            },
            valueSources: ['value'],
            preferWidgets: ['number'],
        },
        price: {
            label: 'Price',
            type: 'number',
            valueSources: ['value'],
            fieldSettings: {
                min: 10,
                max: 100,
            },
            preferWidgets: ['slider', 'rangeslider'],
        },
        color: {
            label: 'Color',
            type: 'select',
            valueSources: ['value'],
            fieldSettings: {
                listValues: [
                    { value: 'yellow', title: 'Yellow' },
                    { value: 'green', title: 'Green' },
                    { value: 'orange', title: 'Orange' },
                ],
            },
        },
        is_promotion: {
            label: 'Promo?',
            type: 'boolean',
            operators: ['equal'],
            valueSources: ['value'],
        },
    },
};

const mapDimensionToConfigField = (dimension: Dimension): SimpleField => {
    const label = `${friendlyName(dimension.table)} ${friendlyName(
        dimension.name,
    )}`;
    switch (dimension.type) {
        case DimensionType.STRING:
            return {
                label,
                type: 'text',
                excludeOperators: ['proximity'],
            };
        case DimensionType.NUMBER:
            return {
                label,
                type: 'number',
            };
        case DimensionType.BOOLEAN:
            return {
                label,
                type: 'boolean',
            };
        case DimensionType.DATE:
            return {
                label,
                type: 'date',
            };
        case DimensionType.TIMESTAMP:
            return {
                label,
                type: 'datetime',
            };
        default:
            return {
                label,
                type: 'text',
            };
    }
};

const mapDimensionsToConfigFields = (
    dimensions: Dimension[],
): Config['fields'] =>
    dimensions.reduce<Config['fields']>(
        (acc, dimension) => ({
            ...acc,
            [`\${${getFieldRef(dimension)}}`]:
                mapDimensionToConfigField(dimension),
        }),
        {},
    );

// You can load query value from your backend storage (for saving see `Query.onChange()`)
const queryValue: JsonGroup = { id: QbUtils.uuid(), type: 'group' };

const Demo: React.FC = () => {
    const explore = useTable();
    const dimensions = explore?.data ? getDimensions(explore.data) : [];

    const config: Config = {
        ...BasicConfig,
        operators: {
            ...BasicConfig.operators,
            is_empty: {
                label: 'Is null',
                labelForFormat: 'IS NULL',
                sqlOp: 'IS NULL',
                cardinality: 0,
                reversedOp: 'is_not_empty',
                formatOp: function formatOp(
                    field,
                    op,
                    value,
                    valueSrc,
                    valueType,
                    opDef,
                    operatorOptions,
                    isForDisplay,
                ) {
                    return isForDisplay
                        ? ''.concat(field, ' IS NULL')
                        : '!'.concat(field);
                },
                jsonLogic: '!',
            },
            is_not_empty: {
                label: 'Is not null',
                labelForFormat: 'IS NOT NULL',
                sqlOp: 'IS NOT NULL',
                cardinality: 0,
                reversedOp: 'is_empty',
                formatOp: function formatOp(
                    field,
                    op,
                    value,
                    valueSrc,
                    valueType,
                    opDef,
                    operatorOptions,
                    isForDisplay,
                ) {
                    return isForDisplay
                        ? ''.concat(field, ' IS NOT NULL')
                        : '!!'.concat(field);
                },
                jsonLogic: '!!',
            },
        },
        fields: mapDimensionsToConfigFields(dimensions),
    };
    console.log('config', config);
    const [state, setState] = useState({
        tree: QbUtils.checkTree(QbUtils.loadTree(queryValue), config),
        config,
    });

    const onChange = (immutableTree: ImmutableTree, newConfig: Config) => {
        // Tip: for better performance you can apply `throttle` - see `examples/demo`
        setState({ tree: immutableTree, config: newConfig });

        const jsonTree = QbUtils.getTree(immutableTree);
        console.log(jsonTree);
    };

    const renderBuilder = (props: BuilderProps) => (
        <div className="query-builder-container">
            <div className="query-builder qb-lite">
                <Builder {...props} />
            </div>
        </div>
    );

    return (
        <div style={{ padding: '10px' }}>
            <Query
                {...config}
                value={state.tree}
                onChange={onChange}
                renderBuilder={renderBuilder}
            />
            <div className="query-builder-result">
                <div>
                    <b>SQL where:</b>
                    <p>
                        {JSON.stringify(
                            QbUtils.sqlFormat(state.tree, state.config),
                        )}
                    </p>
                    <b>Jsonlogic:</b>
                    <p>
                        {JSON.stringify(
                            QbUtils.jsonLogicFormat(state.tree, state.config),
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Demo;
