import React from 'react';
import DataTable from 'react-data-table-component';

function getSelectorValue(row, selector, rowIndex) {
    if (typeof selector === 'function') return selector(row, rowIndex);
    if (typeof selector !== 'string') return null;

    return selector.split('.').reduce((value, key) => value?.[key], row);
}

function ResponsiveDataTable({columns, data, ...props}) {
    const responsiveColumns = columns.map((column) => ({
        ...column,
        cell: (row, rowIndex, currentColumn, id) => {
            const content = column.cell
                ? column.cell(row, rowIndex, currentColumn, id)
                : column.format
                    ? column.format(row, rowIndex)
                    : getSelectorValue(row, column.selector, rowIndex);

            return (
                <div className="responsive-data-cell" data-label={typeof column.name === 'string' ? column.name : ''}>
                    {content}
                </div>
            );
        },
    }));

    return (
        <div className="responsive-data-table">
            <DataTable {...props} columns={responsiveColumns} data={data}/>
        </div>
    );
}

export default ResponsiveDataTable;
