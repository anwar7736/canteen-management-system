import type {ReactElement, ReactNode} from 'react';

export interface ResponsiveDataColumn<T> {
    name: ReactNode;
    selector?: string | ((row: T, rowIndex?: number) => unknown);
    format?: (row: T, rowIndex?: number) => ReactNode;
    cell?: (row: T, rowIndex?: number, column?: ResponsiveDataColumn<T>, id?: string | number) => ReactNode;
    sortable?: boolean;
    omit?: boolean;
    exportable?: boolean;
}

export interface ResponsiveDataTableProps<T> {
    columns: ResponsiveDataColumn<T>[];
    data: T[];
    keyField?: string;
    pagination?: boolean;
    paginationPerPage?: number;
    noHeader?: boolean;
    selectableRows?: boolean;
    selectableRowsSingle?: boolean;
    clearSelectedRows?: boolean;
    onSelectedRowsChange?: (selection: {
        selectedRows: T[];
        allSelected?: boolean;
        selectedCount: number;
    }) => void;
}

declare function ResponsiveDataTable<T>(props: ResponsiveDataTableProps<T>): ReactElement;

export default ResponsiveDataTable;
