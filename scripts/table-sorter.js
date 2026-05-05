export default class TableSorter {
    constructor(tableId, config) {
        this.table = document.getElementById(tableId);
        this.tbody = this.table.querySelector('tbody');
        this.headers = this.table.querySelectorAll('thead th');
        this.config = config;

        this.injectStyles(); // Add the CSS first
        this.init();
    }

    injectStyles() {
        // Prevent injecting styles multiple times if you have multiple tables
        if (document.getElementById('table-sorter-styles')) return;

        const style = document.createElement('style');
        style.id = 'table-sorter-styles';
        style.textContent = `
            th.ts-sortable {
                cursor: pointer;
                user-select: none;
                position: relative;
                padding-right: 20px !important; /* Make room for arrows */
            }
            th.ts-sortable::after {
                content: '\\2195'; /* Up/Down arrow */
                position: absolute;
                right: 5px;
                color: #ccc;
            }
            th.ts-sort-asc::after {
                content: '\\2191'; /* Up arrow */
                color: black;
            }
            th.ts-sort-desc::after {
                content: '\\2193'; /* Down arrow */
                color: black;
            }
            /* Optional hover effect */
            th.ts-sortable:hover {
                background-color: rgba(0,0,0,0.05);
            }
        `;
        document.head.appendChild(style);
    }

    init() {
        this.headers.forEach((th, index) => {
            const columnConfig = this.config.columns[index];
            if (columnConfig && columnConfig.sortable) {
                // I prefixed classes with 'ts-' (table-sorter) to prevent conflicts
                th.classList.add('ts-sortable');

                th.addEventListener('click', () => {
                    const isAscending = th.classList.contains('ts-sort-asc');
                    this.sortColumn(index, columnConfig.type, !isAscending);
                });
            }
        });

        if (this.config.defaultSort) {
            const { index, direction } = this.config.defaultSort;
            const colConfig = this.config.columns[index];
            if (colConfig) {
                this.sortColumn(index, colConfig.type, direction === 'asc');
            }
        }

        this.enableColumnDragging();
    }

    sortColumn(index, type, isAscending) {
        this.headers.forEach(th => {
            th.classList.remove('ts-sort-asc', 'ts-sort-desc');
        });
        this.headers[index].classList.add(isAscending ? 'ts-sort-asc' : 'ts-sort-desc');

        const rows = Array.from(this.tbody.querySelectorAll('tr'));

        const sortedRows = rows.sort((rowA, rowB) => {
            const valA = this.getCellValue(rowA, index);
            const valB = this.getCellValue(rowB, index);

            if (type === 'number') {
                return isAscending ? valA - valB : valB - valA;
            } else {
                return isAscending ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
            }
        });

        // Re-append sorted rows (moves them without destroying state)
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

    // Draggable Column Logic
    enableColumnDragging() {
        let draggedIndex = -1;

        this.headers.forEach(th => {
            // Make headers draggable
            th.draggable = true;

            // 1. Start dragging
            th.addEventListener('dragstart', (e) => {
                // Find current index dynamically because columns might have moved
                draggedIndex = Array.from(th.parentNode.children).indexOf(th);
                e.dataTransfer.effectAllowed = 'move';
                th.style.opacity = '0.5';
            });

            // 2. Drag over another header (required to allow dropping)
            th.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            // 3. Drop
            th.addEventListener('drop', (e) => {
                e.preventDefault();
                th.style.opacity = '1';

                const targetIndex = Array.from(th.parentNode.children).indexOf(th);
                if (draggedIndex === -1 || draggedIndex === targetIndex) return;

                this.moveColumn(draggedIndex, targetIndex);
            });

            // 4. End drag (cleanup)
            th.addEventListener('dragend', () => {
                th.style.opacity = '1';
                draggedIndex = -1;
            });
        });
    }

    moveColumn(fromIndex, toIndex) {
        // Move the header
        const theadRow = this.table.querySelector('thead tr');
        this.moveCell(theadRow, fromIndex, toIndex);

        // Move the cells in every body row
        const tbodyRows = this.tbody.querySelectorAll('tr');
        tbodyRows.forEach(row => {
            this.moveCell(row, fromIndex, toIndex);
        });

        // Update the internal configuration indexes so sorting still works
        this.updateConfigAfterMove(fromIndex, toIndex);

        // Re-query the headers array so it matches the new DOM order
        this.headers = this.table.querySelectorAll('thead th');
    }

    moveCell(row, fromIndex, toIndex) {
        const cells = Array.from(row.children);
        const cellToMove = cells[fromIndex];
        const targetCell = cells[toIndex];

        // Insert before or after depending on drag direction
        if (fromIndex < toIndex) {
            row.insertBefore(cellToMove, targetCell.nextSibling);
        } else {
            row.insertBefore(cellToMove, targetCell);
        }
    }

    updateConfigAfterMove(fromIndex, toIndex) {
        const newConfigColumns = {};
        const oldKeys = Object.keys(this.config.columns).map(Number);

        oldKeys.forEach(oldIndex => {
            let newIndex = oldIndex;
            if (oldIndex === fromIndex) {
                newIndex = toIndex;
            } else if (fromIndex < toIndex && oldIndex > fromIndex && oldIndex <= toIndex) {
                newIndex--;
            } else if (fromIndex > toIndex && oldIndex < fromIndex && oldIndex >= toIndex) {
                newIndex++;
            }
            newConfigColumns[newIndex] = this.config.columns[oldIndex];
        });

        this.config.columns = newConfigColumns;
    }
}
