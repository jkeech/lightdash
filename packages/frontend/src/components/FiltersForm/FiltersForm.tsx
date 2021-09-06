import {
    DimensionType,
    fieldId,
    Filter,
    filterableDimensionsOnly,
    friendlyName,
    getDimensions,
    isFilter,
    RelationalOperator,
} from 'common';
import React, { FC, useState } from 'react';
import { Button, HTMLSelect } from '@blueprintjs/core';
import { StringFilterGroupForm } from './StringFilterForm';
import { NumberFilterGroupForm } from './NumberFilterForm';
import { DateFilterGroupForm } from './DateFilterForm';
import { useExplorer } from '../../providers/ExplorerProvider';
import { useTable } from '../../hooks/useTable';

type FilterGroupFormProps = {
    filter: Filter;
    onDelete: () => void;
    onChange: (filter: Filter) => void;
};

const FilterGroupForm: FC<FilterGroupFormProps> = ({
    filter,
    onDelete,
    onChange,
}) => {
    const { type } = filter;
    switch (filter.type) {
        case DimensionType.STRING:
            return (
                <StringFilterGroupForm
                    filter={filter}
                    onChange={onChange}
                    onDelete={onDelete}
                />
            );
        case DimensionType.BOOLEAN:
            // TODO: handle boolean dimensions
            return null;
        case DimensionType.NUMBER:
            return (
                <NumberFilterGroupForm
                    filter={filter}
                    onChange={onChange}
                    onDelete={onDelete}
                />
            );
        case DimensionType.DATE:
        case DimensionType.TIMESTAMP:
            return (
                <DateFilterGroupForm
                    filter={filter}
                    onChange={onChange}
                    onDelete={onDelete}
                />
            );
        default: {
            const nope: never = filter;
            throw Error(`Filter group form not implemented for ${type}`);
        }
    }
};

const AddFilterGroup = () => {
    const {
        state: { filters: activeFilters },
        actions: { setFilters: setActiveFilters },
    } = useExplorer();
    const [showButton, setShowButton] = useState<boolean>(true);
    const explore = useTable();
    if (explore.status !== 'success') return null;
    const dimensions = explore ? getDimensions(explore.data) : [];

    const onAdd = (filter: Filter) => {
        setActiveFilters({
            ...activeFilters,
            children: [...activeFilters.children, filter],
        });
    };

    const filterableDimensions = filterableDimensionsOnly(dimensions);

    const selectOptions = filterableDimensions.map((dim) => ({
        value: fieldId(dim),
        label: `${friendlyName(dim.table)} ${friendlyName(dim.name)}`,
    }));

    // When user selects a new dimension to filter on
    const onSelect = (id: string) => {
        setShowButton(true);
        const dimension = filterableDimensions.find(
            (dim) => fieldId(dim) === id,
        );
        if (dimension === undefined)
            throw new Error(
                `Selected dimension with id ${id} that does not exist as a filterable dimension in explore ${
                    explore.data.name || 'not loaded'
                }`,
            );

        onAdd({
            type: dimension.type,
            tableName: dimension.table,
            fieldName: dimension.name,
            operator: RelationalOperator.EQUAL,
            values: [],
        });
    };

    const addFilter = () => {
        setShowButton(false);
    };

    if (showButton)
        return (
            <Button minimal onClick={addFilter} icon="plus">
                Add filter
            </Button>
        );
    const placeholderOption = { value: '', label: 'Select a field...' };
    return (
        <HTMLSelect
            style={{ maxWidth: '400px' }}
            fill={false}
            minimal
            onChange={(e) => onSelect(e.currentTarget.value)}
            options={[placeholderOption, ...selectOptions]}
        />
    );
};

export const FiltersForm = () => {
    const {
        state: { filters: activeFilters },
        actions: { setFilters: setActiveFilters },
    } = useExplorer();

    const filters: Filter[] = activeFilters.children.filter(isFilter);

    const onDeleteFilterGroup = (index: number) => {
        setActiveFilters({
            ...activeFilters,
            children: [
                ...activeFilters.children.slice(0, index),
                ...activeFilters.children.slice(index + 1),
            ],
        });
    };

    const onChangeFilterGroup = (index: number, filter: Filter) => {
        setActiveFilters({
            ...activeFilters,
            children: [
                ...activeFilters.children.slice(0, index),
                filter,
                ...activeFilters.children.slice(index + 1),
            ],
        });
    };

    return (
        <div
            style={{
                paddingTop: '10px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'start',
            }}
        >
            {filters.map((filter, idx) => (
                <React.Fragment key={filter.id}>
                    <div
                        style={{
                            paddingLeft: '15px',
                            width: '100%',
                            paddingBottom: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px',
                        }}
                    >
                        <FilterGroupForm
                            filter={filter}
                            onDelete={() => onDeleteFilterGroup(idx)}
                            onChange={(changedFilterGroup) =>
                                onChangeFilterGroup(idx, changedFilterGroup)
                            }
                        />
                    </div>
                </React.Fragment>
            ))}
            <AddFilterGroup />
        </div>
    );
};

export default FiltersForm;
