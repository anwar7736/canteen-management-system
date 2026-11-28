import React, {useEffect, useMemo, useState} from 'react';
import DataTable from 'react-data-table-component';

function getSelectorValue(row, selector, rowIndex) {
    if (typeof selector === 'function') return selector(row, rowIndex);
    if (typeof selector !== 'string') return null;

    return selector.split('.').reduce((value, key) => value?.[key], row);
}

function getCellValue(row, column, rowIndex) {
    const value = getSelectorValue(row, column.selector, rowIndex);
    return column.format ? column.format(row, rowIndex) : value;
}

function toPlainText(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map(toPlainText).filter(Boolean).join(', ');
    if (React.isValidElement(value)) return toPlainText(value.props.children);
    return '';
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeCsv(value) {
    const text = toPlainText(value);
    const safeText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
}

function ResponsiveDataTable({columns = [], data = [], paginationPerPage = 5, ...props}) {
    const [search, setSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(paginationPerPage);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const keyField = props.keyField || 'id';
    useEffect(() => {
        setSelectedRowKeys([]);
    }, [props.clearSelectedRows]);
    useEffect(() => {
        setVisibleCount(paginationPerPage);
    }, [data, paginationPerPage]);
    const searchableColumns = useMemo(() => columns.filter((column) => column.omit !== true), [columns]);
    const exportColumns = useMemo(
        () => columns.filter((column) => column.omit !== true && column.exportable !== false && !column.cell),
        [columns]
    );
    const filteredRows = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();
        if (!query) return data;

        return data.filter((row, rowIndex) => searchableColumns.some((column) =>
            toPlainText(getCellValue(row, column, rowIndex)).toLocaleLowerCase().includes(query)
        ));
    }, [data, search, searchableColumns]);

    const responsiveColumns = useMemo(() => columns.map((column) => ({
        ...column,
        cell: (row, rowIndex, currentColumn, id) => {
            const content = column.cell
                ? column.cell(row, rowIndex, currentColumn, id)
                : getCellValue(row, column, rowIndex);

            return (
                <div className="responsive-data-cell" data-label={typeof column.name === 'string' ? column.name : ''}>
                    {content}
                </div>
            );
        },
    })), [columns]);

    function exportCsv() {
        const lines = [
            exportColumns.map((column) => escapeCsv(column.name || '')).join(','),
            ...filteredRows.map((row, rowIndex) => exportColumns.map((column) =>
                escapeCsv(getCellValue(row, column, rowIndex))
            ).join(',')),
        ];
        const file = new Blob([`\uFEFF${lines.join('\r\n')}`], {type: 'text/csv;charset=utf-8'});
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'table-export.csv';
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function selectMobileRow(row, checked) {
        const rowKey = String(row[keyField]);
        const nextKeys = props.selectableRowsSingle
            ? checked ? [rowKey] : []
            : checked
                ? [...new Set([...selectedRowKeys, rowKey])]
                : selectedRowKeys.filter((key) => key !== rowKey);
        setSelectedRowKeys(nextKeys);
        props.onSelectedRowsChange?.({
            selectedRows: data.filter((item) => nextKeys.includes(String(item[keyField]))),
            allSelected: nextKeys.length === data.length && data.length > 0,
            selectedCount: nextKeys.length,
        });
    }

    function printTable() {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            window.alert('Allow pop-ups to open the print view.');
            return;
        }

        const headings = exportColumns.map((column) => `<th>${escapeHtml(column.name || '')}</th>`).join('');
        const rows = filteredRows.map((row, rowIndex) => (
            `<tr>${exportColumns.map((column) => `<td>${escapeHtml(toPlainText(getCellValue(row, column, rowIndex)))}</td>`).join('')}</tr>`
        )).join('');
        printWindow.document.write(`<!doctype html><html><head><title>Table report</title><style>body{font:14px Arial,sans-serif;padding:24px}h1{font-size:20px;margin-bottom:16px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#f1f5f9}</style></head><body><h1>Table report</h1><table><thead><tr>${headings}</tr></thead><tbody>${rows}</tbody></table><script>window.onload=()=>{window.print();window.close()}</script></body></html>`);
        printWindow.document.close();
    }

    return (
        <div className="responsive-data-table">
            <div className="responsive-data-toolbar">
                <label className="responsive-data-search">
                    <span>Search table</span>
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setVisibleCount(paginationPerPage);
                        }}
                        placeholder="Search records..."
                    />
                </label>
                <div className="responsive-data-actions">
                    <button type="button" className="btn btn-outline-success btn-sm" onClick={exportCsv}>Export CSV</button>
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={printTable}>Print</button>
                </div>
            </div>
            <div className="responsive-data-desktop">
                <DataTable
                    {...props}
                    paginationPerPage={paginationPerPage}
                    pagination={props.pagination !== false}
                    columns={responsiveColumns}
                    data={filteredRows}
                    onSelectedRowsChange={(selection) => {
                        setSelectedRowKeys(selection.selectedRows.map((row) => String(row[keyField])));
                        props.onSelectedRowsChange?.(selection);
                    }}
                />
            </div>
            <div className="responsive-data-mobile" aria-live="polite">
                {filteredRows.slice(0, visibleCount).map((row, rowIndex) => (
                    <article className="responsive-data-card" key={row[keyField] ?? rowIndex}>
                        {props.selectableRows && (
                            <label className="responsive-data-card-select">
                                <input
                                    type="checkbox"
                                    checked={selectedRowKeys.includes(String(row[keyField]))}
                                    onChange={(event) => selectMobileRow(row, event.target.checked)}
                                    aria-label={`Select row ${rowIndex + 1}`}
                                />
                                <span>Select</span>
                            </label>
                        )}
                        {columns.filter((column) => column.omit !== true).map((column, columnIndex) => {
                            const value = column.cell
                                ? column.cell(row, rowIndex, column, row[keyField])
                                : getCellValue(row, column, rowIndex);

                            return (
                                <div className="responsive-data-card-row" key={`${String(column.name || 'column')}-${columnIndex}`}>
                                    <span className="responsive-data-card-label">{typeof column.name === 'string' ? column.name : ''}</span>
                                    <span className="responsive-data-card-value">{value}</span>
                                </div>
                            );
                        })}
                    </article>
                ))}
                {filteredRows.length === 0 && (
                    <div className="responsive-data-empty">{search ? 'No records match your search.' : 'There are no records to display.'}</div>
                )}
                {visibleCount < filteredRows.length && (
                    <button
                        type="button"
                        className="btn btn-outline-success responsive-data-load-more"
                        onClick={() => setVisibleCount((current) => current + paginationPerPage)}
                    >
                        Load more ({filteredRows.length - visibleCount} remaining)
                    </button>
                )}
            </div>
        </div>
    );
}

export default ResponsiveDataTable;
