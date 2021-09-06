import { ControlGroup, NumericInput, TagInput } from '@blueprintjs/core';
import React from 'react';
import { NumberFilter, RelationalOperator } from 'common';
import {
    FilterRow,
    getOperatorOptions,
    SelectFilterOperator,
} from './FilterRow';

type NumberFilterFormProps = {
    filter: NumberFilter;
    onChange: (filter: NumberFilter) => void;
};
const NumberFilterForm = ({ filter, onChange }: NumberFilterFormProps) => {
    const filterType = filter.operator;
    switch (filter.operator) {
        case RelationalOperator.NULL:
        case RelationalOperator.NOT_NULL:
            return null;
        case RelationalOperator.EQUAL:
        case RelationalOperator.NOT_EQUALS:
            return (
                <TagInput
                    fill
                    tagProps={{ minimal: true }}
                    values={filter.values}
                    onAdd={(values) =>
                        onChange({
                            ...filter,
                            values: [
                                ...filter.values,
                                ...values
                                    .map(parseFloat)
                                    .filter((v) => v !== undefined),
                            ],
                        })
                    }
                    onRemove={(value, index) =>
                        onChange({
                            ...filter,
                            values: [
                                ...filter.values.slice(0, index),
                                ...filter.values.slice(index + 1),
                            ],
                        })
                    }
                />
            );
        case RelationalOperator.GREATER_THAN:
        case RelationalOperator.LESS_THAN:
            return (
                <NumericInput
                    fill
                    value={filter.values[0] ?? 0}
                    onValueChange={(value) =>
                        onChange({ ...filter, values: [value] })
                    }
                />
            );
        default: {
            const nope: never = filter.operator;
            throw Error(
                `No form implemented for Number filter operator ${filterType}`,
            );
        }
    }
};

type NumberFilterGroupFormProps = {
    filter: NumberFilter;
    onChange: (filter: NumberFilter) => void;
    onDelete: () => void;
};
export const NumberFilterGroupForm = ({
    filter,
    onChange,
    onDelete,
}: NumberFilterGroupFormProps) => (
    <FilterRow
        key={filter.id}
        tableName={filter.tableName}
        fieldName={filter.fieldName}
        onDelete={onDelete}
    >
        <ControlGroup style={{ width: '100%' }}>
            <SelectFilterOperator<NumberFilter>
                value={filter.operator}
                options={getOperatorOptions([
                    RelationalOperator.EQUAL,
                    RelationalOperator.NOT_EQUALS,
                    RelationalOperator.GREATER_THAN,
                    RelationalOperator.LESS_THAN,
                    RelationalOperator.NULL,
                    RelationalOperator.NOT_NULL,
                ])}
                onChange={(operator) =>
                    onChange({
                        ...filter,
                        operator,
                        values: [],
                    })
                }
            />
            <NumberFilterForm filter={filter} onChange={onChange} />
        </ControlGroup>
    </FilterRow>
);
