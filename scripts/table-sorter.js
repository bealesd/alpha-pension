export default class TableSorter {
    constructor(tableId, config) {
        this.table = document.getElementById(tableId);
        this.tbody = this.table.querySelector('tbody');
        this.headers = this.table.querySelectorAll('thead th');
        this.config = config;

        // Array to hold multi-sort state: [{ index: 0, direction: 'asc', type: 'number' }, ...]
        this.currentSorts = [];

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
                /* Make enough room on the right for the arrow AND the number badge */
                padding-right: 35px !important; 
            }
            th.ts-sortable::after {
                content: '\\2195'; 
                position: absolute;
                /* Move arrow slightly inwards */
                right: 15px; 
                top: 50%;
                transform: translateY(-50%);
                color: #ccc;
            }
            th.ts-sort-asc::after {
                content: '\\2191'; 
                color: black;
            }
            th.ts-sort-desc::after {
                content: '\\2193'; 
                color: black;
            }
            th.ts-sortable:hover {
                background-color: rgba(0,0,0,0.05);
            }
            
            /* Multi-sort priority numbers */
            th[data-ts-sort-index]::before {
                content: attr(data-ts-sort-index);
                position: absolute;
                /* Position it inside the TH, to the right of the arrow */
                right: 2px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 0.7em;
                background: #007bff;
                color: white;
                border-radius: 50%;
                width: 14px;
                height: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                /* Ensure it stays above other elements */
                z-index: 1; 
            }

            .ts-search-wrapper {
                margin-bottom: 10px;
                display: flex;
                justify-content: flex-end; /* Aligns search bar to the right */
            }

            .ts-search-input {
                padding: 6px 12px;
                border-radius: 12px;
                border: 1px solid #d1d5db;
                font-size: 14px;
                box-sizing: border-box;
                width: 100%;
                max-width: 250px;
                font-family: inherit;
            }

            .ts-search-input:focus {
                outline: none;
                border-color: #6366f1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
            }
        `;
        document.head.appendChild(style);
    }

    init() {
        // 1. Add Search Bar if configured
        if (this.config.searchable) {
            this.addSearchBar();
        }

        this.headers.forEach((th, index) => {
            const columnConfig = this.config.columns[index];
            if (columnConfig && columnConfig.sortable) {
                th.classList.add('ts-sortable');

                th.addEventListener('click', (e) => {
                    this.handleHeaderClick(index, columnConfig.type, e.shiftKey);
                });
            }
        });

        if (this.config.defaultSort) {
            const { index, direction } = this.config.defaultSort;
            const colConfig = this.config.columns[index];
            if (colConfig) {
                this.handleHeaderClick(index, colConfig.type, false, direction);
            }
        }
    }

    addSearchBar() {
        // 1. Safety check: Prevent duplicate search bars for this specific table
        const searchWrapperId = `ts-search-wrapper-${this.table.id}`;
        if (document.getElementById(searchWrapperId)) {
            return; // Search bar already exists, exit the function
        }

        const wrapper = document.createElement('div');
        wrapper.id = searchWrapperId; // Assign the unique ID
        wrapper.className = 'ts-search-wrapper';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'ts-search-input';
        searchInput.placeholder = this.config.searchPlaceholder || 'Search...';

        searchInput.addEventListener('input', (e) => {
            this.filterTable(e.target.value.toLowerCase().trim());
        });

        wrapper.appendChild(searchInput);

        const tableWrapper = this.table.closest('.table-wrapper');

        if (tableWrapper) {
            tableWrapper.parentNode.insertBefore(wrapper, tableWrapper);
        } else {
            this.table.parentNode.insertBefore(wrapper, this.table);
        }
    }

    filterTable(searchTerm) {
        const rows = this.tbody.querySelectorAll('tr');

        rows.forEach(row => {
            // Build a string of all values in this specific row
            let rowText = '';
            for (let i = 0; i < row.children.length; i++) {
                // We use your existing getCellValue so it correctly reads the inputs/selects!
                rowText += this.getCellValue(row, i) + ' ';
            }

            // If the row text includes the search term, show it. Otherwise, hide it.
            if (rowText.toLowerCase().includes(searchTerm)) {
                row.style.display = ''; // Resets display to default (shows row)
            } else {
                row.style.display = 'none'; // Hides row
            }
        });
    }

    handleHeaderClick(index, type, isShiftKey, forceDirection = null) {
        // Find if this column is already being sorted
        const existingSortIndex = this.currentSorts.findIndex(s => s.index === index);
        let newDirection = 'asc';

        if (existingSortIndex > -1) {
            // Toggle direction if already sorting by this column
            newDirection = this.currentSorts[existingSortIndex].direction === 'asc' ? 'desc' : 'asc';
        }

        if (forceDirection) {
            newDirection = forceDirection;
        }

        if (!isShiftKey) {
            // Standard click: Clear all other sorts
            this.currentSorts = [{ index, direction: newDirection, type }];
        } else {
            // Shift + Click: Add/Update multi-sort
            if (existingSortIndex > -1) {
                // Update existing column direction
                this.currentSorts[existingSortIndex].direction = newDirection;
            } else {
                // Add new column to the sort array
                this.currentSorts.push({ index, direction: newDirection, type });
            }
        }

        this.applySort();
    }

    applySort() {
        // 1. Update UI (arrows and priority numbers)
        this.headers.forEach(th => {
            th.classList.remove('ts-sort-asc', 'ts-sort-desc');
            th.removeAttribute('data-ts-sort-index');
        });

        this.currentSorts.forEach((sortDef, i) => {
            const th = this.headers[sortDef.index];
            th.classList.add(sortDef.direction === 'asc' ? 'ts-sort-asc' : 'ts-sort-desc');
            // If multi-sorting, show a little number indicating primary/secondary sort
            if (this.currentSorts.length > 1) {
                th.setAttribute('data-ts-sort-index', i + 1);
            }
        });

        // 2. Sort the rows
        const rows = Array.from(this.tbody.querySelectorAll('tr'));

        const sortedRows = rows.sort((rowA, rowB) => {
            // Loop through our sort criteria
            for (let sortDef of this.currentSorts) {
                let valA = this.getCellValue(rowA, sortDef.index);
                let valB = this.getCellValue(rowB, sortDef.index);

                let comparison = 0;

                if (sortDef.type === 'number') {
                    // Strip out £, $, commas, and spaces before converting to a number
                    const cleanA = String(valA).replace(/[^0-9.-]+/g, "");
                    const cleanB = String(valB).replace(/[^0-9.-]+/g, "");

                    const numA = Number(cleanA) || 0;
                    const numB = Number(cleanB) || 0;
                    comparison = numA - numB;
                } else {
                    comparison = String(valA).localeCompare(String(valB));
                }

                // If they are not equal, we have our tiebreaker! Return the result.
                if (comparison !== 0) {
                    return sortDef.direction === 'asc' ? comparison : -comparison;
                }

                // If they are equal, the loop continues to the next sort field in the array
            }
            return 0; // Completely equal across all sort fields
        });

        // 3. Re-append rows to DOM
        sortedRows.forEach(row => this.tbody.appendChild(row));
    }

    getCellValue(row, index) {
        const cell = row.children[index];
        if (!cell) return '';

        const input = cell.querySelector('input, select');
        if (input) {
            return input.value;
        }
        return cell.textContent.trim();
    }
}
