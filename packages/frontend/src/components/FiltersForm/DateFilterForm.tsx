import { ControlGroup } from '@blueprintjs/core';
import { DateInput, TimePrecision } from '@blueprintjs/datetime';
import React, { FC } from 'react';
import {
    DateAndTimestampFilter,
    DimensionType,
    formatDate,
    formatTimestamp,
    parseDate,
    parseTimestamp,
    RelationalOperator,
} from 'common';
import {
    FilterRow,
    getOperatorOptions,
    OperatorLabels,
    SelectFilterOperator,
} from './FilterRow';

const DateOperatorLabels = {
    ...OperatorLabels,
    [RelationalOperator.LESS_THAN]: 'is before',
    [RelationalOperator.LESS_THAN_OR_EQUAL]: 'is on or before',
    [RelationalOperator.GREATER_THAN]: 'is after',
    [RelationalOperator.GREATER_THAN_OR_EQUAL]: 'is on or after',
};

type FilterFormProps = {
    filter: DateAndTimestampFilter;
    onChange: (filter: DateAndTimestampFilter) => void;
};
const FilterForm: FC<FilterFormProps> = ({ filter, onChange }) => {
    const filterType = filter.operator;
    switch (filter.operator) {
        case RelationalOperator.NULL:
        case RelationalOperator.NOT_NULL:
            return null;
        case RelationalOperator.EQUAL:
        case RelationalOperator.NOT_EQUALS:
        case RelationalOperator.GREATER_THAN:
        case RelationalOperator.LESS_THAN:
        case RelationalOperator.GREATER_THAN_OR_EQUAL:
        case RelationalOperator.LESS_THAN_OR_EQUAL:
            return (
                <DateInput
                    value={
                        filter.values[0]
                            ? new Date(filter.values[0])
                            : new Date()
                    }
                    timePrecision={
                        filter.type === DimensionType.TIMESTAMP
                            ? TimePrecision.MILLISECOND
                            : undefined
                    }
                    formatDate={
                        filter.type === DimensionType.TIMESTAMP
                            ? formatTimestamp
                            : formatDate
                    }
                    parseDate={
                        filter.type === DimensionType.TIMESTAMP
                            ? parseTimestamp
                            : parseDate
                    }
                    defaultValue={new Date()}
                    onChange={(value) =>
                        onChange({ ...filter, values: [value] })
                    }
                />
            );
        default: {
            const nope: never = filter.operator;
            throw Error(
                `No form implemented for date filter operator ${filterType}`,
            );
        }
    }
};

type DateFilterGroupFormProps = {
    filter: DateAndTimestampFilter;
    onChange: (filter: DateAndTimestampFilter) => void;
    onDelete: () => void;
};
export const DateFilterGroupForm = ({
    filter,
    onChange,
    onDelete,
}: DateFilterGroupFormProps) => (
    <FilterRow
        key={filter.id}
        tableName={filter.tableName}
        fieldName={filter.fieldName}
        onDelete={onDelete}
    >
        <ControlGroup style={{ width: '100%' }}>
            <SelectFilterOperator<DateAndTimestampFilter>
                value={filter.operator}
                options={getOperatorOptions(
                    [
                        RelationalOperator.EQUAL,
                        RelationalOperator.NOT_EQUALS,
                        RelationalOperator.GREATER_THAN,
                        RelationalOperator.GREATER_THAN_OR_EQUAL,
                        RelationalOperator.LESS_THAN,
                        RelationalOperator.LESS_THAN_OR_EQUAL,
                        RelationalOperator.NULL,
                        RelationalOperator.NOT_NULL,
                    ],
                    DateOperatorLabels,
                )}
                onChange={(operator) =>
                    onChange({
                        ...filter,
                        operator,
                        values: [],
                    })
                }
            />
            <FilterForm filter={filter} onChange={onChange} />
        </ControlGroup>
    </FilterRow>
);
