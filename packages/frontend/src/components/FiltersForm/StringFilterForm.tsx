import { RelationalOperator, StringFilter } from 'common';
import React, { FC } from 'react';
import { ControlGroup, InputGroup, TagInput } from '@blueprintjs/core';
import {
    FilterRow,
    getOperatorOptions,
    SelectFilterOperator,
} from './FilterRow';

type StringFilterGroupFormProps = {
    filter: StringFilter;
    onChange: (filter: StringFilter) => void;
    onDelete: () => void;
};

type StringFilterFormProps = {
    filter: StringFilter;
    onChange: (filter: StringFilter) => void;
};
// Can't switch generic: https://github.com/microsoft/TypeScript/pull/43183
const StringFilterForm = ({ filter, onChange }: StringFilterFormProps) => {
    const { operator } = filter;
    switch (operator) {
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
                            values: [...filter.values, ...values],
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
        case RelationalOperator.NULL:
        case RelationalOperator.NOT_NULL:
            return null;
        case RelationalOperator.STARTS_WITH:
            return (
                <InputGroup
                    fill
                    value={filter.values[0] ?? ''}
                    onChange={(e) =>
                        onChange({ ...filter, values: [e.currentTarget.value] })
                    }
                />
            );
        default: {
            const nope: never = operator;
            throw Error(
                `No form implemented for String filter operator ${operator}`,
            );
        }
    }
};

export const StringFilterGroupForm: FC<StringFilterGroupFormProps> = ({
    filter,
    onChange,
    onDelete,
}) => (
    <>
        <FilterRow
            key={filter.id}
            tableName={filter.tableName}
            fieldName={filter.fieldName}
            onDelete={onDelete}
        >
            <ControlGroup style={{ width: '100%' }}>
                <SelectFilterOperator<StringFilter>
                    value={filter.operator}
                    options={getOperatorOptions([
                        RelationalOperator.EQUAL,
                        RelationalOperator.NOT_EQUALS,
                        RelationalOperator.STARTS_WITH,
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
                <StringFilterForm filter={filter} onChange={onChange} />
            </ControlGroup>
        </FilterRow>
    </>
);
