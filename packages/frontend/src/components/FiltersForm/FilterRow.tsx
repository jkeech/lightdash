import {
    DateAndTimestampFilter,
    friendlyName,
    NumberFilter,
    RelationalOperator,
    StringFilter,
} from 'common';
import { Button, HTMLSelect } from '@blueprintjs/core';
import React, { ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

type Filter = NumberFilter | StringFilter | DateAndTimestampFilter;
export const assertFilterId = <T extends Filter>(
    filter: T,
): T & { id: string } => {
    const { id } = filter;
    if (id !== undefined) {
        return { ...filter, id };
    }
    return { ...filter, id: uuidv4() };
};

type FilterRowProps = {
    tableName: string;
    fieldName: string;
    onDelete: () => void;
    children: ReactNode;
};
export const FilterRow = ({
    tableName,
    fieldName,
    children,
    onDelete,
}: FilterRowProps) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
        }}
    >
        <div style={{ flex: '0 0 300px' }}>
            {friendlyName(tableName)} <b>{friendlyName(fieldName)}</b>
        </div>
        <div
            style={{
                maxWidth: '400px',
                flex: '1 0 auto',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
            }}
        >
            {children}
        </div>
        <div
            style={{
                flex: '0 0 70px',
                display: 'flex',
                justifyContent: 'flex-start',
            }}
        >
            <Button minimal icon="cross" onClick={onDelete} />
        </div>
    </div>
);

export const OperatorLabels = {
    [RelationalOperator.EQUAL]: 'is equal to',
    [RelationalOperator.NOT_EQUALS]: 'is not equal to',
    [RelationalOperator.STARTS_WITH]: 'startsWith',
    [RelationalOperator.NULL]: 'is null',
    [RelationalOperator.NOT_NULL]: 'is not null',
    [RelationalOperator.LESS_THAN]: 'is less than',
    [RelationalOperator.LESS_THAN_OR_EQUAL]: 'is less or equal than',
    [RelationalOperator.GREATER_THAN]: 'is greater than',
    [RelationalOperator.GREATER_THAN_OR_EQUAL]: 'is greater or equal than',
};

export const getOperatorOptions = <T extends RelationalOperator>(
    operators: T[],
    labelMap = OperatorLabels,
): { value: T; label: string }[] =>
    operators.map((value) => ({
        value,
        label: labelMap[value] || value,
    }));

type SelectFilterOperatorProps<T extends Filter> = {
    value: T['operator'];
    options: { value: T['operator']; label: string }[];
    onChange: (operator: T['operator']) => void;
};

export const SelectFilterOperator = <T extends Filter>({
    value,
    options,
    onChange,
}: SelectFilterOperatorProps<T>) => (
    <HTMLSelect
        fill={false}
        value={value}
        style={{ width: '150px' }}
        minimal
        options={options}
        onChange={(event) =>
            onChange(event.currentTarget.value as typeof value)
        }
    />
);
