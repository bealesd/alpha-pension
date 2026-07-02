import { AddedPension } from "../scripts/added-pension.js";
import { cpiSeptember } from "../scripts/cpi-september.js";
import { Helpers } from "../scripts/helper.js";
import TableEnhancer from "../scripts/table-enhancer.js";
import { EmployeeContributions } from "../scripts/employee-contributions.js";

const STORAGE_KEY = 'historicSalaryState';
const THEME_KEY = 'pensionCalculatorTheme';
const BREAKDOWN_COLUMN_VISIBILITY_KEY = 'historicSalaryBreakdownColumnVisibility';

const CONTRIBUTION_RATE = 0.0232;

const DOM_IDS = Object.freeze({
    themeToggle: 'theme-toggle',
    breakdownColumnControls: 'breakdown-column-controls'
});

const DOM_CLASSES = Object.freeze({
    
});

const ADDED_PENSION_TYPE = Object.freeze({
    SELF: 'self',
    DEPENDANTS: 'dependants'
});

const VALID_ADDED_PENSION_TYPES = Object.freeze(Object.values(ADDED_PENSION_TYPE));

const ADDED_PENSION_GROUP = Object.freeze({
    TOTAL: 'total',
    SELF: ADDED_PENSION_TYPE.SELF,
    DEPENDANTS: ADDED_PENSION_TYPE.DEPENDANTS
});

const ADDED_PENSION_GROUPS = Object.freeze([
    ADDED_PENSION_GROUP.TOTAL,
    ADDED_PENSION_GROUP.SELF,
    ADDED_PENSION_GROUP.DEPENDANTS
]);

const ADDED_PENSION_GROUP_CLASS = Object.freeze({
    [ADDED_PENSION_GROUP.TOTAL]: 'ap-total',
    [ADDED_PENSION_GROUP.SELF]: 'ap-self',
    [ADDED_PENSION_GROUP.DEPENDANTS]: 'ap-dependants'
});

const BREAKDOWN_COLUMN_GROUPS = Object.freeze({
    info: 'Info',
    sp: 'Salary Pension',
    spPresent: 'Salary Pension Present Value',
    apTotal: 'Added Pension Total',
    apPresent: 'Added Pension Present Value',
    apSelf: 'Added Pension Self',
    apDependants: 'Added Pension Dependants',
    total: 'Totals'
});

const BREAKDOWN_COLUMNS = Object.freeze([
    { index: 0, group: 'info', key: 'year', label: 'Year' },
    { index: 1, group: 'info', key: 'age', label: 'Age' },

    { index: 2, group: 'sp', key: 'openSp', label: 'Open SP' },
    { index: 3, group: 'sp', key: 'salary', label: 'Salary' },
    { index: 4, group: 'sp', key: 'sp', label: 'SP' },
    { index: 5, group: 'sp', key: 'cpi', label: 'CPI' },
    { index: 6, group: 'sp', key: 'spRise', label: 'SP Rise' },
    { index: 7, group: 'sp', key: 'closeSp', label: 'Close SP' },

    { index: 8, group: 'spPresent', key: 'spPresent', label: 'SP Present Year' },
    { index: 9, group: 'spPresent', key: 'closeSpPresent', label: 'Close SP Present Year' },

    { index: 10, group: 'apTotal', key: 'openAp', label: 'Open AP' },
    { index: 11, group: 'apTotal', key: 'apSpent', label: 'AP Spent' },
    { index: 12, group: 'apTotal', key: 'ap', label: 'AP' },
    { index: 13, group: 'apTotal', key: 'apRise', label: 'AP Rise' },
    { index: 14, group: 'apTotal', key: 'closeAp', label: 'Close AP' },

    { index: 15, group: 'apPresent', key: 'apPresent', label: 'AP Present Year' },
    { index: 16, group: 'apPresent', key: 'closeApPresent', label: 'Close AP Present Year' },

    { index: 17, group: 'apSelf', key: 'openApSelf', label: 'Open AP Self' },
    { index: 18, group: 'apSelf', key: 'apSelfSpent', label: 'AP Self Spent' },
    { index: 19, group: 'apSelf', key: 'apSelf', label: 'AP Self' },
    { index: 20, group: 'apSelf', key: 'apSelfRise', label: 'AP Self Rise' },
    { index: 21, group: 'apSelf', key: 'closeApSelf', label: 'Close AP Self' },

    { index: 22, group: 'apDependants', key: 'openApDependants', label: 'Open AP Dependants' },
    { index: 23, group: 'apDependants', key: 'apDependantsSpent', label: 'AP Dependants Spent' },
    { index: 24, group: 'apDependants', key: 'apDependants', label: 'AP Dependants' },
    { index: 25, group: 'apDependants', key: 'apDependantsRise', label: 'AP Dependants Rise' },
    { index: 26, group: 'apDependants', key: 'closeApDependants', label: 'Close AP Dependants' },

    { index: 27, group: 'total', key: 'pensionIncrease', label: 'Pension Increase' },
    { index: 28, group: 'total', key: 'totalPension', label: 'Total Pension' }
]);

function isAddedPensionType(type) {
    return VALID_ADDED_PENSION_TYPES.includes(type);
}

class HistoricSalaryUI {
    constructor() {
        this.addedTableId = 'added-table';
        this.breakdownTableId = 'breakdown-table';
        this.salaryTableId = 'salary-table';

        this.themeToggle = document.getElementById(DOM_IDS.themeToggle);
        this.salaryTableBody = document.querySelector('#salary-table tbody');
        this.addedTableBody = document.querySelector('#added-table tbody');
        this.breakdownBody = document.querySelector('#breakdown-table tbody');
        this.breakdownColumnControls = document.getElementById(DOM_IDS.breakdownColumnControls);

        this.addSalaryRowButton = document.getElementById('add-salary-row');
        this.addAddedRowButton = document.getElementById('add-added-row');

        this.totalSalary = document.getElementById('total-salary');
        this.totalAdded = document.getElementById('total-added');
        this.totalSalaryContributions = document.getElementById('total-salary-contributions');
        this.totalSalaryPension = document.getElementById('total-salary-pension');
        this.totalAddedPension = document.getElementById('total-added-pension');
        this.totalCombined = document.getElementById('total-combined');

        this.inflationInfo = document.getElementById('inflation-info');
        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importFile = document.getElementById('importFile');
        this.dobInput = document.getElementById('dob');

        this.addedPension = new AddedPension();
        this.breakdownSorter = null;
        this.breakdownColumnVisibility = this.loadBreakdownColumnVisibility();

        this.registerEventListeners();

        const inflationMax = Math.max(...Object.keys(cpiSeptember).map(Number));
        this.inflationInfo.textContent = `The calculator has no historical inflation figures for September ${inflationMax + 1} and beyond. Any calculation beyond ${inflationMax + 1} will not be adjusted for inflation.`;

        this.updateCurrentYearForYearlyBreakdownHeaders();
        this.renderBreakdownColumnControls();

        this.loadTheme();
        this.loadState();
        this.update();

        this.addTableSortingForAp();
        this.addTableSortingForSalary();
    }

    registerEventListeners() {
        this.addSalaryRowButton.addEventListener('click', this.handleAddSalaryRow.bind(this));
        this.addAddedRowButton.addEventListener('click', this.handleAddAddedRow.bind(this));

        this.salaryTableBody.addEventListener('input', this.handleInput.bind(this));
        this.salaryTableBody.addEventListener('click', this.handleRemoveRow.bind(this));

        this.addedTableBody.addEventListener('input', this.handleInput.bind(this));
        this.addedTableBody.addEventListener('click', this.handleRemoveRow.bind(this));

        this.exportBtn.addEventListener('click', this.handleExport.bind(this));

        this.importBtn.addEventListener('click', () => this.importFile.click());
        this.importFile.addEventListener('change', this.handleImportFile.bind(this));

        this.dobInput.addEventListener('input', this.handleInput.bind(this));
        this.themeToggle.addEventListener('click', this.handleThemeToggle.bind(this));
    }

    updateCurrentYearForYearlyBreakdownHeaders() {
        this.currentYear = Helpers.getCurrentYear();

        document.querySelectorAll('[data-bind="current-year"]').forEach(el => {
            el.textContent = `${this.currentYear}`.slice(-2);
        });
    }

    loadTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved ?? (prefersDark ? 'dark' : 'light');

        document.documentElement.setAttribute('data-theme', theme);
    }

    handleThemeToggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(THEME_KEY, next);
    }

    handleExport() {
        this.exportState();
    }

    handleImportFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const parsedState = JSON.parse(event.target.result);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedState));
                this.loadState();
                this.update();
                alert('Settings imported successfully!');
            } catch (err) {
                alert('Invalid file format. Please upload a valid JSON backup.');
                console.error(err);
            }
        };

        reader.readAsText(file);
        e.target.value = '';
    }

    handleAddSalaryRow(event) {
        event.preventDefault();
        this.addSalaryRow({ year: 2024, salary: 0 });
        this.update();
    }

    handleAddAddedRow(event) {
        event.preventDefault();

        this.addAddedRow({
            year: 2024,
            type: ADDED_PENSION_TYPE.SELF,
            period: 'year',
            added: 0,
            actuaryVersion: '2025-02'
        });

        this.update();
    }

    handleRemoveRow(event) {
        if (!event.target.classList.contains('remove-row')) return;

        event.target.closest('tr').remove();
        this.update();
    }

    handleInput() {
        this.update();
    }

    addTableSortingForAp() {
        new TableEnhancer(this.addedTableId, {
            columns: {
                0: { sortable: true, type: 'number' },
                1: { sortable: true, type: 'string' },
                2: { sortable: true, type: 'string' },
                3: { sortable: true, type: 'string' },
                4: { sortable: true, type: 'number' }
            },
            defaultSort: { index: 0, direction: 'asc' }
        });
    }

    addTableSortingForSalary() {
        new TableEnhancer(this.salaryTableId, {
            columns: {
                0: { sortable: true, type: 'number' },
                1: { sortable: true, type: 'number' }
            },
            defaultSort: { index: 0, direction: 'asc' }
        });
    }

    addSalaryRow(data) {
        const template = document.getElementById('salary-row');
        const row = template.content.cloneNode(true);
        const tr = row.querySelector('tr');

        tr.querySelector('.year').value = data.year || 2024;
        tr.querySelector('.salary').value = data.salary || 0;

        this.salaryTableBody.appendChild(tr);
    }

    addAddedRow(data) {
        const template = document.getElementById('added-row');
        const row = template.content.cloneNode(true);
        const tr = row.querySelector('tr');

        const type = isAddedPensionType(data.type)
            ? data.type
            : ADDED_PENSION_TYPE.DEPENDANTS;

        tr.querySelector('.actuary-version').value = data.actuaryVersion || '2025-02';
        tr.querySelector('.year').value = data.year || 2024;
        tr.querySelector('.type').value = type;
        tr.querySelector('.period').value = data.period || 'year';
        tr.querySelector('.added').value = data.added || 0;

        this.addedTableBody.appendChild(tr);
    }

    getSalaryRows() {
        return [...this.salaryTableBody.querySelectorAll('tr')]
            .map(row => ({
                year: Number(row.querySelector('.year').value) || 0,
                salary: Number(row.querySelector('.salary').value) || 0
            }))
            .filter(row => row.year > 0)
            .sort((a, b) => a.year - b.year);
    }

    getAddedRows() {
        return [...this.addedTableBody.querySelectorAll('tr')]
            .map(row => ({
                year: Number(row.querySelector('.year').value) || 0,
                actuaryVersion: row.querySelector('.actuary-version').value,
                type: row.querySelector('.type').value,
                period: row.querySelector('.period').value,
                added: Number(row.querySelector('.added').value) || 0
            }))
            .filter(row => row.year > 0)
            .sort((a, b) => a.year - b.year);
    }

    getSettings() {
        const dob = Temporal.PlainDate.from(this.dobInput.value || '1980-01-01');
        return { dob };
    }

    estimateSalaryPension(row) {
        return row.salary * CONTRIBUTION_RATE;
    }

    estimateAddedPension(purchased, dob, schemeStartYear, type, actuaryVersion) {
        return this.addedPension.calculateAddedPensionForYearForGivenAge(
            purchased,
            type,
            dob,
            schemeStartYear,
            actuaryVersion
        );
    }

    calculateLedgerRow(year, currentBalance, newContributions) {
        const opening = currentBalance;
        const openingAdjusted = Helpers.getSingleYearCpiAdjustedValue(year, opening);
        const addedAdjusted = Helpers.getSingleYearCpiAdjustedValue(year, newContributions);

        const inflationChange = (openingAdjusted - opening) + (addedAdjusted - newContributions);
        const closing = openingAdjusted + addedAdjusted;

        return { opening, inflationChange, closing };
    }

    getEmptyPensionSummary() {
        return {
            input: 0,
            unadjusted: 0,
            adjustedToPresent: 0
        };
    }

    addToPensionSummary(summary, contribution) {
        summary.input += contribution.input;
        summary.unadjusted += contribution.unadjusted;
        summary.adjustedToPresent += contribution.adjustedToPresent;
    }

    getYearlySpSummary(salaryRow, schemeStartDate) {
        const input = salaryRow ? salaryRow.salary : 0;
        const unadjusted = salaryRow ? this.estimateSalaryPension(salaryRow) : 0;

        const adjustedToPresent = Helpers.getCpiAdjustedValue(
            schemeStartDate.year,
            unadjusted,
            this.currentYear
        );

        const outOfPocketCost = EmployeeContributions.calculateCost(
            schemeStartDate.year,
            input
        );

        return {
            input,
            unadjusted,
            adjustedToPresent,
            outOfPocketCost
        };
    }

    getYearlyApSummaries(addedRowsForYear, dob, schemeStartDate) {
        const summaries = {
            [ADDED_PENSION_GROUP.TOTAL]: this.getEmptyPensionSummary(),
            [ADDED_PENSION_GROUP.SELF]: this.getEmptyPensionSummary(),
            [ADDED_PENSION_GROUP.DEPENDANTS]: this.getEmptyPensionSummary()
        };

        for (const row of addedRowsForYear) {
            if (!isAddedPensionType(row.type)) {
                console.warn(`Unknown added pension type "${row.type}" ignored`, row);
                continue;
            }

            const purchasedAp = row.period === 'month'
                ? row.added * 12
                : row.added;

            const amount = this.estimateAddedPension(
                purchasedAp,
                dob,
                schemeStartDate.year,
                row.type,
                row.actuaryVersion
            );

            const adjustedToPresent = Helpers.getCpiAdjustedValue(
                schemeStartDate.year,
                amount,
                this.currentYear
            );

            const contribution = {
                input: purchasedAp,
                unadjusted: amount,
                adjustedToPresent
            };

            this.addToPensionSummary(summaries[ADDED_PENSION_GROUP.TOTAL], contribution);
            this.addToPensionSummary(summaries[row.type], contribution);
        }

        return summaries;
    }

    groupAddedRowsByYear(addedRows) {
        return addedRows.reduce((acc, row) => {
            (acc[row.year] = acc[row.year] || []).push(row);
            return acc;
        }, {});
    }

    createApLedgerStates() {
        return Object.fromEntries(
            ADDED_PENSION_GROUPS.map(group => [
                group,
                {
                    current: 0,
                    adjustedToPresent: 0
                }
            ])
        );
    }

    calculateApLedgerState(row, state, group) {
        const summary = row.apByGroup[group];

        state.adjustedToPresent += summary.adjustedToPresent;

        const ledger = this.calculateLedgerRow(
            row.year,
            state.current,
            summary.unadjusted
        );

        state.current = ledger.closing;

        return {
            summary,
            ledger,
            closingAdjustedToPresent: state.adjustedToPresent
        };
    }

    update() {
        const settings = this.getSettings();
        const salaryRows = this.getSalaryRows();
        const addedRows = this.getAddedRows();

        const salaryByYear = Object.fromEntries(salaryRows.map(row => [row.year, row]));
        const addedByYear = this.groupAddedRowsByYear(addedRows);

        const allYears = [...new Set([
            ...Object.keys(salaryByYear),
            ...Object.keys(addedByYear)
        ])]
            .map(Number)
            .sort((a, b) => a - b);

        let totalSalaryPension = 0;
        let totalAddedPension = 0;

        const detailedRows = allYears.map(year => {
            const schemeDates = Helpers.getSchemeDatesForYear(year);
            const age = Helpers.getAgeAtDate(settings.dob, schemeDates.schemeStartDate);

            const sp = this.getYearlySpSummary(
                salaryByYear[year],
                schemeDates.schemeStartDate
            );

            const apByGroup = this.getYearlyApSummaries(
                addedByYear[year] || [],
                settings.dob,
                schemeDates.schemeStartDate
            );

            const apTotal = apByGroup[ADDED_PENSION_GROUP.TOTAL];

            totalSalaryPension += sp.adjustedToPresent;
            totalAddedPension += apTotal.adjustedToPresent;

            return {
                year,
                age,
                sp,
                ap: apTotal,
                apByGroup,
                totalAdjustedToPresent: sp.adjustedToPresent + apTotal.adjustedToPresent
            };
        });

        this.updateUI({
            totalSalary: detailedRows.reduce((sum, row) => sum + row.sp.input, 0),
            totalSalaryContributions: detailedRows.reduce((sum, row) => sum + row.sp.outOfPocketCost, 0),
            totalAdded: detailedRows.reduce((sum, row) => sum + row.ap.input, 0),
            salaryPension: totalSalaryPension,
            addedPension: totalAddedPension
        });

        this.renderBreakdown(detailedRows);
        this.saveState(salaryRows, addedRows, settings);
    }

    updateUI(totals) {
        this.totalSalary.textContent = this.formatCurrency(totals.totalSalary);
        this.totalSalaryContributions.textContent = this.formatCurrency(totals.totalSalaryContributions);
        this.totalAdded.textContent = this.formatCurrency(totals.totalAdded);
        this.totalSalaryPension.textContent = this.formatCurrency(totals.salaryPension);
        this.totalAddedPension.textContent = this.formatCurrency(totals.addedPension);
        this.totalCombined.textContent = this.formatCurrency(totals.salaryPension + totals.addedPension);
    }

    renderBreakdown(rows) {
        this.breakdownBody.innerHTML = '';

        let cumulativePensionAdjustedToPresentYear = 0;
        let closingSpAdjustedToPresentYear = 0;
        let currentSp = 0;

        const apLedgerStates = this.createApLedgerStates();

        for (const row of rows) {
            const cpi = Helpers.getSingleYearCpi(row.year);

            cumulativePensionAdjustedToPresentYear += row.totalAdjustedToPresent;

            closingSpAdjustedToPresentYear += row.sp.adjustedToPresent;
            const spLedger = this.calculateLedgerRow(row.year, currentSp, row.sp.unadjusted);
            currentSp = spLedger.closing;

            const apTotal = this.calculateApLedgerState(
                row,
                apLedgerStates[ADDED_PENSION_GROUP.TOTAL],
                ADDED_PENSION_GROUP.TOTAL
            );

            const apSelf = this.calculateApLedgerState(
                row,
                apLedgerStates[ADDED_PENSION_GROUP.SELF],
                ADDED_PENSION_GROUP.SELF
            );

            const apDependants = this.calculateApLedgerState(
                row,
                apLedgerStates[ADDED_PENSION_GROUP.DEPENDANTS],
                ADDED_PENSION_GROUP.DEPENDANTS
            );

            const startYearLastTwo = `${row.year}`.slice(-2);
            const endYearLastTwo = `${row.year + 1}`.slice(-2);

            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td class="info group-start sticky-col sticky-year">${startYearLastTwo}/${endYearLastTwo}</td>
                <td class="info sticky-col sticky-age">${row.age}</td>

                <td class="sp-info group-start">${this.formatCurrency(spLedger.opening)}</td>
                <td class="sp-info">${this.formatCurrency(row.sp.input)}</td>
                <td class="sp-info">${this.formatCurrency(row.sp.unadjusted)}</td>
                <td class="sp-info">${(cpi || 0).toFixed(1)}</td>
                <td class="sp-info">${this.formatCurrency(spLedger.inflationChange)}</td>
                <td class="sp-info">${this.formatCurrency(spLedger.closing)}</td>

                <td class="sp-info-extra group-start">${this.formatCurrency(row.sp.adjustedToPresent)}</td>
                <td class="sp-info-extra">${this.formatCurrency(closingSpAdjustedToPresentYear)}</td>

                ${this.renderApLedgerCells(apTotal, ADDED_PENSION_GROUP.TOTAL)}

                <td class="ap-info-extra group-start">${this.formatCurrency(row.ap.adjustedToPresent)}</td>
                <td class="ap-info-extra">${this.formatCurrency(apTotal.closingAdjustedToPresent)}</td>

                ${this.renderApLedgerCells(apSelf, ADDED_PENSION_GROUP.SELF)}
                ${this.renderApLedgerCells(apDependants, ADDED_PENSION_GROUP.DEPENDANTS)}

                <td class="info group-start">${this.formatCurrency(row.totalAdjustedToPresent)}</td>
                <td class="info">${this.formatCurrency(cumulativePensionAdjustedToPresentYear)}</td>
            `;

            this.breakdownBody.appendChild(tr);
        }

        this.ensureBreakdownSorter();
        this.applyBreakdownColumnVisibility();

        if (this.breakdownSorter) {
            this.breakdownSorter.refresh();
        }
    }

    renderApLedgerCells(apLedgerResult, group) {
        const { summary, ledger } = apLedgerResult;
        const groupClass = ADDED_PENSION_GROUP_CLASS[group];

        return `
            <td class="ap-info ${groupClass} group-start">${this.formatCurrency(ledger.opening)}</td>
            <td class="ap-info ${groupClass}">${this.formatCurrency(summary.input)}</td>
            <td class="ap-info ${groupClass}">${this.formatCurrency(summary.unadjusted)}</td>
            <td class="ap-info ${groupClass}">${this.formatCurrency(ledger.inflationChange)}</td>
            <td class="ap-info ${groupClass}">${this.formatCurrency(ledger.closing)}</td>
        `;
    }

    ensureBreakdownSorter() {
        if (this.breakdownSorter) return;

        this.breakdownSorter = new TableEnhancer(this.breakdownTableId, {
            searchable: true,
            searchPlaceholder: 'Search years, age...',
            rowHover: true,
            columns: this.getBreakdownSortableColumns(),
            defaultSort: {
                index: 0,
                direction: 'asc'
            }
        });
    }

    getBreakdownSortableColumns() {
        return Object.fromEntries(
            BREAKDOWN_COLUMNS.map(column => [
                column.index,
                {
                    sortable: true,
                    type: 'number'
                }
            ])
        );
    }

    loadBreakdownColumnVisibility() {
        const defaultVisibility = Object.fromEntries(
            Object.keys(BREAKDOWN_COLUMN_GROUPS).map(group => [group, true])
        );

        const saved = localStorage.getItem(BREAKDOWN_COLUMN_VISIBILITY_KEY);
        if (!saved) return defaultVisibility;

        try {
            const parsed = JSON.parse(saved);

            return {
                ...defaultVisibility,
                ...parsed
            };
        } catch (error) {
            console.warn('Failed to load breakdown column visibility', error);
            return defaultVisibility;
        }
    }

    saveBreakdownColumnVisibility() {
        localStorage.setItem(
            BREAKDOWN_COLUMN_VISIBILITY_KEY,
            JSON.stringify(this.breakdownColumnVisibility)
        );
    }

    renderBreakdownColumnControls() {
        if (!this.breakdownColumnControls) return;

        this.breakdownColumnControls.innerHTML = '';

        for (const [groupKey, groupLabel] of Object.entries(BREAKDOWN_COLUMN_GROUPS)) {
            const label = document.createElement('label');
            label.className = 'column-toggle';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = this.breakdownColumnVisibility[groupKey] !== false;
            input.dataset.columnGroup = groupKey;

            input.addEventListener('change', () => {
                this.setColumnGroupVisibility(groupKey, input.checked);
            });

            label.append(input, document.createTextNode(groupLabel));
            this.breakdownColumnControls.appendChild(label);
        }
    }

    setColumnGroupVisibility(groupKey, visible) {
        this.breakdownColumnVisibility[groupKey] = visible;
        this.saveBreakdownColumnVisibility();

        const hiddenColumnIndexes = this.getColumnIndexesForGroup(groupKey);

        if (!visible && this.breakdownSorter) {
            this.breakdownSorter.removeSortForColumns(hiddenColumnIndexes);
        }

        this.applyBreakdownColumnVisibility();

        if (this.breakdownSorter) {
            this.breakdownSorter.refresh();
        }
    }

    getColumnIndexesForGroup(groupKey) {
        return BREAKDOWN_COLUMNS
            .filter(column => column.group === groupKey)
            .map(column => column.index);
    }

    applyBreakdownColumnVisibility() {
        const table = document.getElementById(this.breakdownTableId);
        if (!table) return;

        for (const column of BREAKDOWN_COLUMNS) {
            const visible = this.breakdownColumnVisibility[column.group] !== false;

            table.querySelectorAll('tr').forEach(row => {
                const cell = row.children[column.index];
                if (cell) {
                    cell.hidden = !visible;
                }
            });
        }

        this.updateVisibleGroupStarts();
    }

    updateVisibleGroupStarts() {
        const table = document.getElementById(this.breakdownTableId);
        if (!table) return;

        table.querySelectorAll('.group-start').forEach(cell => {
            cell.classList.remove('group-start');
        });

        for (const groupKey of Object.keys(BREAKDOWN_COLUMN_GROUPS)) {
            const firstVisibleColumn = BREAKDOWN_COLUMNS.find(column => {
                if (column.group !== groupKey) return false;

                const header = table.tHead?.rows[0]?.children[column.index];
                return header && !header.hidden;
            });

            if (!firstVisibleColumn) continue;

            table.querySelectorAll('tr').forEach(row => {
                const cell = row.children[firstVisibleColumn.index];

                if (cell && !cell.hidden) {
                    cell.classList.add('group-start');
                }
            });
        }
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            maximumFractionDigits: 0
        }).format(value);
    }

    formatSigned(value) {
        const sign = value > 0 ? '+' : '';
        return `${sign}${this.formatCurrency(value)}`;
    }

    saveState(salaryRows, addedRows, settings) {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                salaryRows,
                addedRows,
                settings
            })
        );
    }

    loadState() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        try {
            const state = JSON.parse(saved);

            if (state.settings) {
                this.dobInput.value = state.settings.dob ?? this.dobInput.value;
            }

            if (Array.isArray(state.salaryRows)) {
                this.salaryTableBody.innerHTML = '';
                state.salaryRows.forEach(row => this.addSalaryRow(row));
            }

            if (Array.isArray(state.addedRows)) {
                this.addedTableBody.innerHTML = '';
                state.addedRows.forEach(row => this.addAddedRow(row));
            }
        } catch (error) {
            console.warn('Failed to load historic salary state', error);
        }
    }

    exportState() {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            alert('No settings found to export.');
            return;
        }

        try {
            const state = JSON.parse(saved);
            const prettyJsonString = JSON.stringify(state, null, 2);

            const blob = new Blob([prettyJsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;

            const dateStr = new Date().toISOString().split('T')[0];
            a.download = `pension-settings-${dateStr}.json`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export state', error);
            alert('There was an error generating the export file.');
        }
    }
}

new HistoricSalaryUI();
