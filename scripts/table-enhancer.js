const DOM_CLASSES = Object.freeze({
    tableRowSelected: 'table-row-selected'
});

export default class TableEnhancer {
    constructor(tableId, config) {
        this.table = document.getElementById(tableId);

        if (!this.table) {
            throw new Error(`TableEnhancer could not find table #${tableId}`);
        }

        this.tbody = this.table.querySelector('tbody');
        this.headers = this.table.querySelectorAll('thead th');
        this.config = config;

        this.currentSorts = [];
        this.currentSearchTerm = '';

        if (this.table.dataset.tableEnhancerInit) {
            console.warn(`TableEnhancer already initialized for #${tableId}`);
            return;
        }

        this.table.dataset.tableEnhancerInit = 'true';

        this.injectStyles();
        this.init();
    }

    injectStyles() {
        if (document.getElementById('table-sorter-styles')) return;

        const style = document.createElement('style');
        style.id = 'table-sorter-styles';

        style.textContent = `
            th.ts-sortable {
                cursor: pointer;
                user-select: none;
                position: relative;
                padding-right: 35px !important;
            }

            th.ts-sortable::after {
                content: '\\2195';
                position: absolute;
                right: 15px;
                top: 50%;
                transform: translateY(-50%);
                color: var(--color-text-muted, #9ca3af);
            }

            th.ts-sort-asc::after {
                content: '\\2191';
                color: var(--color-text, #111827);
            }

            th.ts-sort-desc::after {
                content: '\\2193';
                color: var(--color-text, #111827);
            }

            th.ts-sortable:hover {
                background-color: var(--color-bg-hover, rgba(0, 0, 0, 0.05));
            }

            th[data-ts-sort-index]::before {
                content: attr(data-ts-sort-index);
                position: absolute;
                right: 2px;
                top: 50%;
                transform: translateY(-50%);
                width: 14px;
                height: 14px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1;
                font-size: 0.7em;
                color: #ffffff;
                background: var(--color-primary, #4f46e5);
            }

            .ts-search-wrapper {
                margin-bottom: 10px;
                display: flex;
                justify-content: flex-end;
            }

            .ts-search-input {
                width: 100%;
                max-width: 250px;
                padding: 6px 12px;
                border: 1px solid var(--color-border, #d1d5db);
                border-radius: 999px;
                box-sizing: border-box;
                font: inherit;
                font-size: 14px;
                color: var(--color-text, #111827);
                background: var(--color-bg-input, #ffffff);
            }

            .ts-search-input:focus {
                outline: none;
                border-color: var(--color-primary, #6366f1);
                box-shadow: 0 0 0 3px var(--color-primary-ring, rgba(99, 102, 241, 0.12));
            }

            tr.table-row-selected {
                outline: 2px solid var(--color-primary, #4f46e5);
                outline-offset: -2px;
            }
        `;

        document.head.appendChild(style);
    }

    init() {
        if (this.config.searchable) {
            this.addSearchBar();
        }

        if (this.config.rowHover) {
            this.addRowHover();
        }

        this.addRowHighlightListener();
        this.addHeaderListeners();

        if (this.config.defaultSort) {
            const { index, direction } = this.config.defaultSort;
            const colConfig = this.config.columns[index];

            if (colConfig) {
                this.handleHeaderClick(index, colConfig.type, false, direction);
            }
        }
    }

    addHeaderListeners() {
        this.headers.forEach((th, index) => {
            const columnConfig = this.config.columns[index];

            if (!columnConfig || !columnConfig.sortable) return;

            th.classList.add('ts-sortable');

            th.addEventListener('click', (event) => {
                if (th.hidden) return;

                this.handleHeaderClick(
                    index,
                    columnConfig.type,
                    event.shiftKey
                );
            });
        });
    }

    addRowHover() {
        this.tbody.classList.add('hover');
    }

    addRowHighlightListener() {
        this.tbody.addEventListener('click', (event) => {
            if (event.target.closest('button, a, input, select, textarea, label')) {
                return;
            }

            const row = event.target.closest('tr');
            if (row) {
                row.classList.toggle(DOM_CLASSES.tableRowSelected);
            }
        });
    }

    addSearchBar() {
        const searchWrapperId = `ts-search-wrapper-${this.table.id}`;

        if (document.getElementById(searchWrapperId)) {
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.id = searchWrapperId;
        wrapper.className = 'ts-search-wrapper';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'ts-search-input';
        searchInput.placeholder = this.config.searchPlaceholder || 'Search...';

        searchInput.addEventListener('input', (event) => {
            this.currentSearchTerm = event.target.value.toLowerCase().trim();
            this.filterTable(this.currentSearchTerm);
        });

        wrapper.appendChild(searchInput);

        const tableWrapper = this.table.closest('.table-wrapper');

        if (tableWrapper) {
            tableWrapper.parentNode.insertBefore(wrapper, tableWrapper);
        } else {
            this.table.parentNode.insertBefore(wrapper, this.table);
        }
    }

    refresh() {
        if (this.config.rowHover) {
            this.addRowHover();
        }

        if (this.currentSearchTerm) {
            this.filterTable(this.currentSearchTerm);
        }

        this.removeHiddenColumnSorts();

        if (this.currentSorts.length > 0) {
            this.applySort();
        } else {
            this.updateSortIndicators();
        }
    }

    filterTable(searchTerm) {
        const rows = this.tbody.querySelectorAll('tr');

        rows.forEach(row => {
            let rowText = '';

            for (let i = 0; i < row.children.length; i++) {
                const cell = row.children[i];

                if (!this.config.searchHiddenColumns && cell.hidden) {
                    continue;
                }

                rowText += `${this.getCellValue(row, i)} `;
            }

            row.style.display = rowText.toLowerCase().includes(searchTerm)
                ? ''
                : 'none';
        });
    }

    handleHeaderClick(index, type, isShiftKey, forceDirection = null) {
        const header = this.headers[index];

        if (header?.hidden) {
            return;
        }

        const existingSortIndex = this.currentSorts.findIndex(sort => sort.index === index);
        let newDirection = 'asc';

        if (existingSortIndex > -1) {
            newDirection = this.currentSorts[existingSortIndex].direction === 'asc'
                ? 'desc'
                : 'asc';
        }

        if (forceDirection) {
            newDirection = forceDirection;
        }

        if (!isShiftKey) {
            this.currentSorts = [{ index, direction: newDirection, type }];
        } else if (existingSortIndex > -1) {
            this.currentSorts[existingSortIndex].direction = newDirection;
        } else {
            this.currentSorts.push({ index, direction: newDirection, type });
        }

        this.applySort();
    }

    removeSortForColumn(index) {
        const originalLength = this.currentSorts.length;

        this.currentSorts = this.currentSorts.filter(sort => sort.index !== index);

        if (this.currentSorts.length !== originalLength) {
            this.applySort();
        } else {
            this.updateSortIndicators();
        }
    }

    removeSortForColumns(indexes) {
        const hiddenIndexes = new Set(indexes);
        const originalLength = this.currentSorts.length;

        this.currentSorts = this.currentSorts.filter(sort => !hiddenIndexes.has(sort.index));

        if (this.currentSorts.length !== originalLength && this.currentSorts.length > 0) {
            this.applySort();
        } else {
            this.updateSortIndicators();
        }
    }

    removeHiddenColumnSorts() {
        const originalLength = this.currentSorts.length;

        this.currentSorts = this.currentSorts.filter(sort => {
            const header = this.headers[sort.index];
            return header && !header.hidden;
        });

        if (this.currentSorts.length !== originalLength) {
            this.updateSortIndicators();
        }
    }

    applySort() {
        this.updateSortIndicators();

        const rows = Array.from(this.tbody.querySelectorAll('tr'));

        const sortedRows = rows.sort((rowA, rowB) => {
            for (const sortDef of this.currentSorts) {
                const header = this.headers[sortDef.index];

                if (header?.hidden) {
                    continue;
                }

                const valA = this.getCellValue(rowA, sortDef.index);
                const valB = this.getCellValue(rowB, sortDef.index);

                let comparison = 0;

                if (sortDef.type === 'number') {
                    const cleanA = String(valA).replace(/[^0-9.-]+/g, '');
                    const cleanB = String(valB).replace(/[^0-9.-]+/g, '');

                    const numA = Number(cleanA) || 0;
                    const numB = Number(cleanB) || 0;

                    comparison = numA - numB;
                } else {
                    comparison = String(valA).localeCompare(String(valB));
                }

                if (comparison !== 0) {
                    return sortDef.direction === 'asc'
                        ? comparison
                        : -comparison;
                }
            }

            return 0;
        });

        sortedRows.forEach(row => this.tbody.appendChild(row));
    }

    updateSortIndicators() {
        this.headers.forEach(th => {
            th.classList.remove('ts-sort-asc', 'ts-sort-desc');
            th.removeAttribute('data-ts-sort-index');
        });

        this.currentSorts.forEach((sortDef, index) => {
            const th = this.headers[sortDef.index];

            if (!th || th.hidden) return;

            th.classList.add(
                sortDef.direction === 'asc'
                    ? 'ts-sort-asc'
                    : 'ts-sort-desc'
            );

            if (this.currentSorts.length > 1) {
                th.setAttribute('data-ts-sort-index', index + 1);
            }
        });
    }

    getCellValue(row, index) {
        const cell = row.children[index];

        if (!cell) {
            return '';
        }

        const input = cell.querySelector('input, select');

        if (input) {
            return input.value;
        }

        return cell.textContent.trim();
    }
}
