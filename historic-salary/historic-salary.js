import { AddedPension } from "../scripts/added-pension.js";
import { cpiSeptember } from "../data/inflation/cpi-september.js";
import { MemberTimeline } from "../scripts/member-timeline.js";
import { CpiCalculator } from "./scripts/cpi-calculator.js";
import TableEnhancer from "../scripts/table-enhancer.js";
import { EmployeeContributions } from "./scripts/employee-contributions.js";

function isAddedPensionType(type) {
    return HistoricSalaryUI.VALID_ADDED_PENSION_TYPES.includes(type);
}

function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidYear(value) {
    return Number.isInteger(value) && value >= 1900 && value <= 2200;
}

function isNonNegativeNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isValidDob(value) {
    if (typeof value !== 'string') return false;

    try {
        Temporal.PlainDate.from(value);
        return true;
    } catch {
        return false;
    }
}

function validateSalaryRow(row, index) {
    const errors = [];

    if (!isPlainObject(row)) {
        return [`salaryRows[${index}] must be an object.`];
    }

    if (!isValidYear(row.year)) {
        errors.push(`salaryRows[${index}].year must be a valid year.`);
    }

    if (!isNonNegativeNumber(row.salary)) {
        errors.push(`salaryRows[${index}].salary must be a non-negative number.`);
    }

    return errors;
}

function validateAddedRow(row, index) {
    const errors = [];

    if (!isPlainObject(row)) {
        return [`addedRows[${index}] must be an object.`];
    }

    if (!isValidYear(row.year)) {
        errors.push(`addedRows[${index}].year must be a valid year.`);
    }

    if (typeof row.actuaryVersion !== 'string' || row.actuaryVersion.trim() === '') {
        errors.push(`addedRows[${index}].actuaryVersion must be a non-empty string.`);
    }

    if (!isAddedPensionType(row.type)) {
        errors.push(`addedRows[${index}].type must be "${HistoricSalaryUI.ADDED_PENSION_TYPE.SELF}" or "${HistoricSalaryUI.ADDED_PENSION_TYPE.DEPENDANTS}".`);
    }

    if (!HistoricSalaryUI.VALID_ADDED_PENSION_PERIODS.includes(row.period)) {
        errors.push(`addedRows[${index}].period must be "${HistoricSalaryUI.ADDED_PENSION_PERIOD.YEAR}" or "${HistoricSalaryUI.ADDED_PENSION_PERIOD.MONTH}".`);
    }

    if (!isNonNegativeNumber(row.added)) {
        errors.push(`addedRows[${index}].added must be a non-negative number.`);
    }

    return errors;
}

function validateHistoricSalaryState(state) {
    const errors = [];

    if (!isPlainObject(state)) {
        return {
            valid: false,
            errors: ['State must be an object.']
        };
    }

    if (state.version !== undefined && state.version !== HistoricSalaryUI.STATE_VERSION) {
        errors.push(`Unsupported state version "${state.version}".`);
    }

    if (!Array.isArray(state.salaryRows)) {
        errors.push('salaryRows must be an array.');
    } else {
        state.salaryRows.forEach((row, index) => {
            errors.push(...validateSalaryRow(row, index));
        });
    }

    if (!Array.isArray(state.addedRows)) {
        errors.push('addedRows must be an array.');
    } else {
        state.addedRows.forEach((row, index) => {
            errors.push(...validateAddedRow(row, index));
        });
    }

    if (!isPlainObject(state.settings)) {
        errors.push('settings must be an object.');
    } else if (!isValidDob(state.settings.dob)) {
        errors.push('settings.dob must be a valid ISO date string.');
    } else if (state.settings.cpi !== undefined &&
        !isNonNegativeNumber(state.settings.cpi)) {
        errors.push('settings.cpi must be a non negative number.');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

function formatValidationErrors(errors) {
    return errors.map(error => `• ${error}`).join('\n');
}

class HistoricSalaryUI {
    static THEME_KEY = 'pensionCalculatorTheme';
    static BREAKDOWN_COLUMN_VISIBILITY_KEY = 'historicSalaryBreakdownColumnVisibility';

    static STATE_VERSION = 1;
    static DEFAULT_DOB = '1980-01-01';
    static DEFAULT_ACTUARY_VERSION = '2025-02';
    static DEFAULT_SALARY = 40000;
    static DEFAULT_ADDED = 4000;

    static CONTRIBUTION_RATE = 0.0232;

    static DOM_IDS = Object.freeze({
        themeToggle: 'theme-toggle',
        breakdownColumnControls: 'breakdown-column-controls',

        salaryTable: 'salary-table',
        addedTable: 'added-table',
        breakdownTable: 'breakdown-table',

        addSalaryRowButton: 'add-salary-row',
        addAddedRowButton: 'add-added-row',

        totalSalary: 'total-salary',
        totalAdded: 'total-added',
        totalSalaryContributions: 'total-salary-contributions',
        totalSalaryPension: 'total-salary-pension',
        totalAddedPension: 'total-added-pension',
        totalCombined: 'total-combined',

        inflationInfo: 'inflation-info',
        exportButton: 'export-btn',
        importButton: 'import-btn',
        importFile: 'import-file',
        dob: 'dob',
        cpi: 'cpi',

        salaryRowTemplate: 'salary-row',
        addedRowTemplate: 'added-row'
    });

    static DOM_BINDINGS = Object.freeze({
        currentYear: 'current-year',
        latestYear: 'latest-year',
        lastYearOfCpi: 'last-year-of-cpi',
    });

    static ADDED_PENSION_TYPE = Object.freeze({
        SELF: 'self',
        DEPENDANTS: 'dependants'
    });

    static VALID_ADDED_PENSION_TYPES = Object.freeze(
        Object.values(HistoricSalaryUI.ADDED_PENSION_TYPE)
    );

    static ADDED_PENSION_PERIOD = Object.freeze({
        YEAR: 'year',
        MONTH: 'month'
    });

    static VALID_ADDED_PENSION_PERIODS = Object.freeze(
        Object.values(HistoricSalaryUI.ADDED_PENSION_PERIOD)
    );

    static ADDED_PENSION_GROUP = Object.freeze({
        TOTAL: 'total',
        SELF: HistoricSalaryUI.ADDED_PENSION_TYPE.SELF,
        DEPENDANTS: HistoricSalaryUI.ADDED_PENSION_TYPE.DEPENDANTS
    });

    static ADDED_PENSION_GROUPS = Object.freeze([
        HistoricSalaryUI.ADDED_PENSION_GROUP.TOTAL,
        HistoricSalaryUI.ADDED_PENSION_GROUP.SELF,
        HistoricSalaryUI.ADDED_PENSION_GROUP.DEPENDANTS
    ]);

    static DOM_CLASSES = Object.freeze({
        year: 'year',
        salary: 'salary',
        actuaryVersion: 'actuary-version',
        type: 'type',
        period: 'period',
        added: 'added',
        removeRow: 'remove-row',

        columnToggle: 'column-toggle',
        groupStart: 'group-start',

        info: 'info',
        spInfo: 'sp-info',
        spInfoExtra: 'sp-info-extra',
        apInfo: 'ap-info',
        apInfoExtra: 'ap-info-extra',

        stickyCol: 'sticky-col',
        stickyYear: 'sticky-year',
        stickyAge: 'sticky-age',

        addedPensionGroup: Object.freeze({
            [HistoricSalaryUI.ADDED_PENSION_GROUP.TOTAL]: 'ap-total',
            [HistoricSalaryUI.ADDED_PENSION_GROUP.SELF]: 'ap-self',
            [HistoricSalaryUI.ADDED_PENSION_GROUP.DEPENDANTS]: 'ap-dependants'
        })
    });

    static BREAKDOWN_COLUMN_GROUPS = Object.freeze({
        info: 'Info',
        sp: 'Salary Pension',
        spPresent: 'Salary Pension Present Value',
        apTotal: 'Added Pension Total',
        apPresent: 'Added Pension Present Value',
        apSelf: 'Added Pension Self',
        apDependants: 'Added Pension Dependants',
        total: 'Totals'
    });

    static BREAKDOWN_COLUMNS = Object.freeze([
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

    currentYear;
    latestYear;
    STORAGE_KEY;
    cpiHelper;
    addedPension;
    enhancedBreakdownTable;
    breakdownColumnVisibility;

    constructor() {
        this.cpiHelper = new CpiCalculator();
        const params = new URLSearchParams(window.location.search);
        this.STORAGE_KEY = params.get("storageKey") || "historic-salary-state";
        this.currentYear = MemberTimeline.getCurrentYear();

        this.addedPension = new AddedPension();
        this.enhancedBreakdownTable = null;
        this.breakdownColumnVisibility = this.loadBreakdownColumnVisibility();

        this.registerEventListeners();

        this.renderBreakdownColumnControls();

        this.loadTheme();
        this.loadState();
        this.update();

        this.addTableSortingForAp();
        this.addTableSortingForSalary();

        this.updateDataBindings({
            currentYear: this.currentYear,
            latestYear: this.latestYear,
            lastYearOfCpi: Math.max(...Object.keys(cpiSeptember).map(Number))
        }, this.bindingHandlers());
    }

    bindingHandlers() {
        return {
            [HistoricSalaryUI.DOM_BINDINGS.currentYear]: (el, state) => {
                if (el instanceof HTMLInputElement) {
                    if (el.value === '')
                        el.value = String(state.currentYear);
                    el.max = String(state.currentYear + 99);
                } else {
                    el.textContent = String(state.currentYear).slice(-2);
                }
            },

            [HistoricSalaryUI.DOM_BINDINGS.latestYear]: (el, state) => {
                el.textContent = String(state.latestYear).slice(-2);
            },

            [HistoricSalaryUI.DOM_BINDINGS.lastYearOfCpi]: (el, state) => {
                el.textContent = String(state.lastYearOfCpi);
            }
        };
    }

    updateDataBindings(state, bindingHandlers) {
        Object.entries(bindingHandlers).forEach(([binding, handler]) => {
            document
                .querySelectorAll(`[data-bind="${binding}"]`)
                .forEach((el) => handler(el, state));
        });
    }

    registerEventListeners() {
        const addSalaryRowButton = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.addSalaryRowButton}`);
        const addAddedRowButton = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.addAddedRowButton}`);
        const salaryTableBody = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.salaryTable} tbody`);
        const addedTableBody = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.addedTable} tbody`);
        const exportButton = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.exportButton}`);
        const importButton = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.importButton}`);
        const importFile = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.importFile}`);
        const dobInput = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.dob}`);
        const cpiInput = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.cpi}`);
        const themeToggle = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.themeToggle}`);

        addSalaryRowButton.addEventListener('click', this.handleAddSalaryRow.bind(this));
        addAddedRowButton.addEventListener('click', this.handleAddAddedRow.bind(this));

        salaryTableBody.addEventListener('input', this.handleInput.bind(this));
        salaryTableBody.addEventListener('click', this.handleRemoveRow.bind(this));

        addedTableBody.addEventListener('input', this.handleInput.bind(this));
        addedTableBody.addEventListener('click', this.handleRemoveRow.bind(this));

        exportButton.addEventListener('click', this.handleExport.bind(this));

        importButton.addEventListener('click', () => {
            importFile.click();
        });

        importFile.addEventListener('change', this.handleImportFile.bind(this));
        dobInput.addEventListener('input', this.handleInput.bind(this));
        cpiInput.addEventListener('input', this.handleInput.bind(this));
        themeToggle.addEventListener('click', this.handleThemeToggle.bind(this));
    }

    loadTheme() {
        const saved = localStorage.getItem(HistoricSalaryUI.THEME_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = saved ?? (prefersDark ? 'dark' : 'light');

        document.documentElement.setAttribute('data-theme', theme);
    }

    handleThemeToggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(HistoricSalaryUI.THEME_KEY, next);
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
                const validation = validateHistoricSalaryState(parsedState);

                if (!validation.valid) {
                    alert(`The imported file is not a valid pension settings backup.\n\n${formatValidationErrors(validation.errors)}`);
                    return;
                }

                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsedState));
                this.loadState();
                this.update();
                alert('Settings imported successfully!');
            } catch (err) {
                alert('Invalid file format. Please upload a valid JSON backup.');
                console.error(err);
            }
        };

        reader.onerror = () => {
            alert('There was an error reading the selected file.');
        };

        reader.readAsText(file);
        e.target.value = '';
    }

    handleAddSalaryRow(event) {
        event.preventDefault();
        const lastSalary = this.getLastSalaryRow();
        this.addSalaryRow(lastSalary);
        this.update();
    }

    handleAddAddedRow(event) {
        event.preventDefault();
        const lastAdded = this.getLastAddedRow();
        this.addAddedRow(lastAdded);
        this.update();
    }

    handleRemoveRow(event) {
        if (!event.target.classList.contains(HistoricSalaryUI.DOM_CLASSES.removeRow)) return;

        event.target.closest('tr').remove();
        this.update();
    }

    handleInput() {
        this.update();
    }

    addTableSortingForAp() {
        new TableEnhancer(HistoricSalaryUI.DOM_IDS.addedTable, {
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
        new TableEnhancer(HistoricSalaryUI.DOM_IDS.salaryTable, {
            columns: {
                0: { sortable: true, type: 'number' },
                1: { sortable: true, type: 'number' }
            },
            defaultSort: { index: 0, direction: 'asc' }
        });
    }

    addSalaryRow(data) {
        const template = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.salaryRowTemplate}`);
        const row = template.content.cloneNode(true);
        const tr = row.querySelector('tr');

        tr.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.year}`).value = data.year ?? this.currentYear;
        tr.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.salary}`).value = data.salary ?? 0;

        document.querySelector(`#${HistoricSalaryUI.DOM_IDS.salaryTable} tbody`).appendChild(tr);
    }

    addAddedRow(data) {
        const template = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.addedRowTemplate}`);
        const row = template.content.cloneNode(true);
        const tr = row.querySelector('tr');

        const type = isAddedPensionType(data.type)
            ? data.type
            : HistoricSalaryUI.ADDED_PENSION_TYPE.DEPENDANTS;

        const period = HistoricSalaryUI.VALID_ADDED_PENSION_PERIODS.includes(data.period)
            ? data.period
            : HistoricSalaryUI.ADDED_PENSION_PERIOD.YEAR;

        tr.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.actuaryVersion}`).value = data.actuaryVersion || HistoricSalaryUI.DEFAULT_ACTUARY_VERSION;
        tr.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.year}`).value = data.year ?? this.currentYear;
        tr.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.type}`).value = type;
        tr.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.period}`).value = period;
        tr.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.added}`).value = data.added ?? 0;

        document.querySelector(`#${HistoricSalaryUI.DOM_IDS.addedTable} tbody`).appendChild(tr);
    }

    getSalaryRows() {
        const salaryTableBody = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.salaryTable} tbody`);

        return [...salaryTableBody.querySelectorAll('tr')]
            .map(row => ({
                year: Number(row.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.year}`).value) || 0,
                salary: Number(row.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.salary}`).value) || 0
            }))
            .filter(row => row.year > 0)
            .sort((a, b) => a.year - b.year);
    }

    getLastSalaryRow() {
        const salaryTableBody = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.salaryTable} tbody`);
        if (!salaryTableBody) return null;

        return [...salaryTableBody.querySelectorAll('tr')]
            .map(row => {
                const yearValue = Number(row.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.year}`)?.value) || 0;
                const salaryValue = Number(row.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.salary}`)?.value) || 0;

                return {
                    year: yearValue > 0 ?
                        yearValue + 1 < this.currentYear + 99 ? yearValue + 1 : yearValue :
                        0,
                    salary: salaryValue
                };
            })
            .filter(row => row.year > 0)
            .sort((a, b) => a.year - b.year)
            .at(-1) ?? {
            year: this.currentYear,
            salary: HistoricSalaryUI.DEFAULT_SALARY
        };
    }

    getAddedRows() {
        const addedTableBody = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.addedTable} tbody`);

        return [...addedTableBody.querySelectorAll('tr')]
            .map(row => ({
                year: Number(row.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.year}`).value) || 0,
                actuaryVersion: row.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.actuaryVersion}`).value,
                type: row.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.type}`).value,
                period: row.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.period}`).value,
                added: Number(row.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.added}`).value) || 0
            }))
            .filter(row => row.year > 0)
            .sort((a, b) => a.year - b.year);
    }

    getLastAddedRow() {
        const addedTableBody = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.addedTable} tbody`);

        return [...addedTableBody.querySelectorAll('tr')]
            .map(row => {
                const yearValue = Number(row.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.year}`).value) || 0;

                return {
                    year: yearValue > 0 ?
                        yearValue + 1 < this.currentYear + 99 ? yearValue + 1 : yearValue :
                        0,
                    actuaryVersion: row.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.actuaryVersion}`).value,
                    type: row.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.type}`).value,
                    period: row.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.period}`).value,
                    added: Number(row.querySelector(`.${HistoricSalaryUI.DOM_CLASSES.added}`).value) || 0
                }
            })
            .filter(row => row.year > 0)
            .sort((a, b) => a.year - b.year)
            .at(-1) ?? {
            year: this.currentYear,
            added: HistoricSalaryUI.DEFAULT_ADDED,
            actuaryVersion: HistoricSalaryUI.DEFAULT_ACTUARY_VERSION,
            period: HistoricSalaryUI.ADDED_PENSION_PERIOD.YEAR,
            type: HistoricSalaryUI.ADDED_PENSION_TYPE.SELF
        };
    }

    getSettings() {
        const dobInput = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.dob}`);
        let dob;
        try {
            dob = Temporal.PlainDate.from(dobInput.value || HistoricSalaryUI.DEFAULT_DOB);
        } catch {
            dob = Temporal.PlainDate.from(HistoricSalaryUI.DEFAULT_DOB);
        }

        const cpiInput = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.cpi}`);
        const cpi = Number(cpiInput.value) || 0;

        return { dob, cpi };
    }

    estimateSalaryPension(row) {
        return row.salary * HistoricSalaryUI.CONTRIBUTION_RATE;
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
        const openingAdjusted = this.cpiHelper.getSingleYearCpiAdjustedValue(year, opening);
        const addedAdjusted = this.cpiHelper.getSingleYearCpiAdjustedValue(year, newContributions);

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

        const adjustedToPresent = this.cpiHelper.getCpiAdjustedValue({
            startYear: schemeStartDate.year,
            endYear: this.currentYear,
            value: unadjusted
        });

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
            [HistoricSalaryUI.ADDED_PENSION_GROUP.TOTAL]: this.getEmptyPensionSummary(),
            [HistoricSalaryUI.ADDED_PENSION_GROUP.SELF]: this.getEmptyPensionSummary(),
            [HistoricSalaryUI.ADDED_PENSION_GROUP.DEPENDANTS]: this.getEmptyPensionSummary()
        };

        for (const row of addedRowsForYear) {
            if (!isAddedPensionType(row.type)) {
                console.warn(`Unknown added pension type "${row.type}" ignored`, row);
                continue;
            }

            const purchasedAp = row.period === HistoricSalaryUI.ADDED_PENSION_PERIOD.MONTH
                ? row.added * 12
                : row.added;

            const amount = this.estimateAddedPension(
                purchasedAp,
                dob,
                schemeStartDate.year,
                row.type,
                row.actuaryVersion
            );

            const adjustedToPresent = this.cpiHelper.getCpiAdjustedValue({
                startYear: schemeStartDate.year,
                endYear: this.currentYear,
                value: amount
            });

            const contribution = {
                input: purchasedAp,
                unadjusted: amount,
                adjustedToPresent
            };

            this.addToPensionSummary(summaries[HistoricSalaryUI.ADDED_PENSION_GROUP.TOTAL], contribution);
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
            HistoricSalaryUI.ADDED_PENSION_GROUPS.map(group => [
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

        this.latestYear = Math.max(...allYears);
        this.cpiHelper.addFutureYearsToCpiData({ endYear: this.latestYear, fallbackCpiRate: settings.cpi });

        let totalSalaryPension = 0;
        let totalAddedPension = 0;

        const detailedRows = allYears.map(year => {
            const schemeDates = MemberTimeline.getSchemeDatesForYear(year);
            const age = MemberTimeline.getMemberAgeAtDate(settings.dob, schemeDates.schemeStartDate);

            const sp = this.getYearlySpSummary(
                salaryByYear[year],
                schemeDates.schemeStartDate
            );

            const apByGroup = this.getYearlyApSummaries(
                addedByYear[year] || [],
                settings.dob,
                schemeDates.schemeStartDate
            );

            const apTotal = apByGroup[HistoricSalaryUI.ADDED_PENSION_GROUP.TOTAL];

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
        document.querySelector(`#${HistoricSalaryUI.DOM_IDS.totalSalary}`).textContent = this.formatCurrency(totals.totalSalary);
        document.querySelector(`#${HistoricSalaryUI.DOM_IDS.totalSalaryContributions}`).textContent = this.formatCurrency(totals.totalSalaryContributions);
        document.querySelector(`#${HistoricSalaryUI.DOM_IDS.totalAdded}`).textContent = this.formatCurrency(totals.totalAdded);
        document.querySelector(`#${HistoricSalaryUI.DOM_IDS.totalSalaryPension}`).textContent = this.formatCurrency(totals.salaryPension);
        document.querySelector(`#${HistoricSalaryUI.DOM_IDS.totalAddedPension}`).textContent = this.formatCurrency(totals.addedPension);
        document.querySelector(`#${HistoricSalaryUI.DOM_IDS.totalCombined}`).textContent = this.formatCurrency(totals.salaryPension + totals.addedPension);
    }

    renderBreakdown(rows) {
        const breakdownBody = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.breakdownTable} tbody`);
        breakdownBody.innerHTML = '';

        let cumulativePensionAdjustedToPresentYear = 0;
        let closingSpAdjustedToPresentYear = 0;
        let currentSp = 0;

        const apLedgerStates = this.createApLedgerStates();

        for (const row of rows) {
            const cpi = this.cpiHelper.getSingleYearCpi(row.year);

            cumulativePensionAdjustedToPresentYear += row.totalAdjustedToPresent;

            closingSpAdjustedToPresentYear += row.sp.adjustedToPresent;
            const spLedger = this.calculateLedgerRow(row.year, currentSp, row.sp.unadjusted);
            currentSp = spLedger.closing;

            const apTotal = this.calculateApLedgerState(
                row,
                apLedgerStates[HistoricSalaryUI.ADDED_PENSION_GROUP.TOTAL],
                HistoricSalaryUI.ADDED_PENSION_GROUP.TOTAL
            );

            const apSelf = this.calculateApLedgerState(
                row,
                apLedgerStates[HistoricSalaryUI.ADDED_PENSION_GROUP.SELF],
                HistoricSalaryUI.ADDED_PENSION_GROUP.SELF
            );

            const apDependants = this.calculateApLedgerState(
                row,
                apLedgerStates[HistoricSalaryUI.ADDED_PENSION_GROUP.DEPENDANTS],
                HistoricSalaryUI.ADDED_PENSION_GROUP.DEPENDANTS
            );

            const startYearLastTwo = `${row.year}`.slice(-2);
            const endYearLastTwo = `${row.year + 1}`.slice(-2);

            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td class="${HistoricSalaryUI.DOM_CLASSES.info} ${HistoricSalaryUI.DOM_CLASSES.groupStart} ${HistoricSalaryUI.DOM_CLASSES.stickyCol} ${HistoricSalaryUI.DOM_CLASSES.stickyYear}">${startYearLastTwo}/${endYearLastTwo}</td>
                <td class="${HistoricSalaryUI.DOM_CLASSES.info} ${HistoricSalaryUI.DOM_CLASSES.stickyCol} ${HistoricSalaryUI.DOM_CLASSES.stickyAge}">${row.age}</td>

                <td class="${HistoricSalaryUI.DOM_CLASSES.spInfo} ${HistoricSalaryUI.DOM_CLASSES.groupStart}">${this.formatCurrency(spLedger.opening)}</td>
                <td class="${HistoricSalaryUI.DOM_CLASSES.spInfo}">${this.formatCurrency(row.sp.input)}</td>
                <td class="${HistoricSalaryUI.DOM_CLASSES.spInfo}">${this.formatCurrency(row.sp.unadjusted)}</td>
                <td class="${HistoricSalaryUI.DOM_CLASSES.spInfo}">${(cpi || 0).toFixed(1)}</td>
                <td class="${HistoricSalaryUI.DOM_CLASSES.spInfo}">${this.formatCurrency(spLedger.inflationChange)}</td>
                <td class="${HistoricSalaryUI.DOM_CLASSES.spInfo}">${this.formatCurrency(spLedger.closing)}</td>

                <td class="${HistoricSalaryUI.DOM_CLASSES.spInfoExtra} ${HistoricSalaryUI.DOM_CLASSES.groupStart}">${this.formatCurrency(row.sp.adjustedToPresent)}</td>
                <td class="${HistoricSalaryUI.DOM_CLASSES.spInfoExtra}">${this.formatCurrency(closingSpAdjustedToPresentYear)}</td>

                ${this.renderApLedgerCells(apTotal, HistoricSalaryUI.ADDED_PENSION_GROUP.TOTAL)}

                <td class="${HistoricSalaryUI.DOM_CLASSES.apInfoExtra} ${HistoricSalaryUI.DOM_CLASSES.groupStart}">${this.formatCurrency(row.ap.adjustedToPresent)}</td>
                <td class="${HistoricSalaryUI.DOM_CLASSES.apInfoExtra}">${this.formatCurrency(apTotal.closingAdjustedToPresent)}</td>

                ${this.renderApLedgerCells(apSelf, HistoricSalaryUI.ADDED_PENSION_GROUP.SELF)}
                ${this.renderApLedgerCells(apDependants, HistoricSalaryUI.ADDED_PENSION_GROUP.DEPENDANTS)}

                <td class="${HistoricSalaryUI.DOM_CLASSES.info} ${HistoricSalaryUI.DOM_CLASSES.groupStart}">${this.formatCurrency(row.totalAdjustedToPresent)}</td>
                <td class="${HistoricSalaryUI.DOM_CLASSES.info}">${this.formatCurrency(cumulativePensionAdjustedToPresentYear)}</td>
            `;

            breakdownBody.appendChild(tr);
        }

        this.enhanceBreakdownTable();
        this.applyBreakdownColumnVisibility();

        if (this.enhancedBreakdownTable) {
            this.enhancedBreakdownTable.refresh();
        }
    }

    renderApLedgerCells(apLedgerResult, group) {
        const { summary, ledger } = apLedgerResult;
        const groupClass = HistoricSalaryUI.DOM_CLASSES.addedPensionGroup[group];

        return `
            <td class="${HistoricSalaryUI.DOM_CLASSES.apInfo} ${groupClass} ${HistoricSalaryUI.DOM_CLASSES.groupStart}">${this.formatCurrency(ledger.opening)}</td>
            <td class="${HistoricSalaryUI.DOM_CLASSES.apInfo} ${groupClass}">${this.formatCurrency(summary.input)}</td>
            <td class="${HistoricSalaryUI.DOM_CLASSES.apInfo} ${groupClass}">${this.formatCurrency(summary.unadjusted)}</td>
            <td class="${HistoricSalaryUI.DOM_CLASSES.apInfo} ${groupClass}">${this.formatCurrency(ledger.inflationChange)}</td>
            <td class="${HistoricSalaryUI.DOM_CLASSES.apInfo} ${groupClass}">${this.formatCurrency(ledger.closing)}</td>
        `;
    }

    enhanceBreakdownTable() {
        if (this.enhancedBreakdownTable) return;

        this.enhancedBreakdownTable = new TableEnhancer(HistoricSalaryUI.DOM_IDS.breakdownTable, {
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
            HistoricSalaryUI.BREAKDOWN_COLUMNS.map(column => [
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
            Object.keys(HistoricSalaryUI.BREAKDOWN_COLUMN_GROUPS).map(group => [group, true])
        );

        const saved = localStorage.getItem(HistoricSalaryUI.BREAKDOWN_COLUMN_VISIBILITY_KEY);
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
            HistoricSalaryUI.BREAKDOWN_COLUMN_VISIBILITY_KEY,
            JSON.stringify(this.breakdownColumnVisibility)
        );
    }

    renderBreakdownColumnControls() {
        const breakdownColumnControls = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.breakdownColumnControls}`);
        if (!breakdownColumnControls) return;

        breakdownColumnControls.innerHTML = '';

        for (const [groupKey, groupLabel] of Object.entries(HistoricSalaryUI.BREAKDOWN_COLUMN_GROUPS)) {
            const label = document.createElement('label');
            label.className = HistoricSalaryUI.DOM_CLASSES.columnToggle;

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = this.breakdownColumnVisibility[groupKey] !== false;
            input.dataset.columnGroup = groupKey;

            input.addEventListener('change', () => {
                this.setColumnGroupVisibility(groupKey, input.checked);
            });

            label.append(input, document.createTextNode(groupLabel));
            breakdownColumnControls.appendChild(label);
        }
    }

    setColumnGroupVisibility(groupKey, visible) {
        this.breakdownColumnVisibility[groupKey] = visible;
        this.saveBreakdownColumnVisibility();

        const hiddenColumnIndexes = this.getColumnIndexesForGroup(groupKey);

        if (!visible && this.enhancedBreakdownTable) {
            this.enhancedBreakdownTable.removeSortForColumns(hiddenColumnIndexes);
        }

        this.applyBreakdownColumnVisibility();

        if (this.enhancedBreakdownTable) {
            this.enhancedBreakdownTable.refresh();
        }
    }

    getColumnIndexesForGroup(groupKey) {
        return HistoricSalaryUI.BREAKDOWN_COLUMNS
            .filter(column => column.group === groupKey)
            .map(column => column.index);
    }

    applyBreakdownColumnVisibility() {
        const table = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.breakdownTable}`);
        if (!table) return;

        for (const column of HistoricSalaryUI.BREAKDOWN_COLUMNS) {
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
        const table = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.breakdownTable}`);
        if (!table) return;

        table.querySelectorAll(`.${HistoricSalaryUI.DOM_CLASSES.groupStart}`).forEach(cell => {
            cell.classList.remove(HistoricSalaryUI.DOM_CLASSES.groupStart);
        });

        for (const groupKey of Object.keys(HistoricSalaryUI.BREAKDOWN_COLUMN_GROUPS)) {
            const firstVisibleColumn = HistoricSalaryUI.BREAKDOWN_COLUMNS.find(column => {
                if (column.group !== groupKey) return false;

                const header = table.tHead?.rows[0]?.children[column.index];
                return header && !header.hidden;
            });

            if (!firstVisibleColumn) continue;

            table.querySelectorAll('tr').forEach(row => {
                const cell = row.children[firstVisibleColumn.index];

                if (cell && !cell.hidden) {
                    cell.classList.add(HistoricSalaryUI.DOM_CLASSES.groupStart);
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

    saveState(salaryRows, addedRows, settings) {
        const state = {
            version: HistoricSalaryUI.STATE_VERSION,
            salaryRows,
            addedRows,
            settings: {
                dob: settings.dob.toString(),
                cpi: settings.cpi
            }
        };

        const validation = validateHistoricSalaryState(state);

        if (!validation.valid) {
            console.error('Refusing to save invalid historic salary state', validation.errors);
            return;
        }

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save historic salary state', error);
        }
    }

    loadState() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (!saved) return;

        try {
            const state = JSON.parse(saved);
            const validation = validateHistoricSalaryState(state);

            if (!validation.valid) {
                console.warn('Invalid saved historic salary state', validation.errors);
                alert(`Your saved settings appear to be invalid and could not be loaded.\n\n${formatValidationErrors(validation.errors)}`);
                return;
            }

            const dobInput = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.dob}`);
            dobInput.value = state.settings.dob ?? dobInput.value;

            const cpiInput = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.cpi}`);
            cpiInput.value = state.settings.cpi ?? Number(cpiInput.value);

            const salaryTableBody = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.salaryTable} tbody`);
            salaryTableBody.innerHTML = '';
            state.salaryRows.forEach(row => this.addSalaryRow(row));

            const addedTableBody = document.querySelector(`#${HistoricSalaryUI.DOM_IDS.addedTable} tbody`);
            addedTableBody.innerHTML = '';
            state.addedRows.forEach(row => this.addAddedRow(row));
        } catch (error) {
            console.warn('Failed to load historic salary state', error);
            alert('Your saved settings could not be loaded because they are not valid JSON.');
        }
    }

    exportState() {
        const saved = localStorage.getItem(this.STORAGE_KEY);

        if (!saved) {
            alert('No settings found to export.');
            return;
        }

        try {
            const state = JSON.parse(saved);
            const validation = validateHistoricSalaryState(state);

            if (!validation.valid) {
                alert(`Your saved settings appear to be invalid and cannot be exported.\n\n${formatValidationErrors(validation.errors)}`);
                return;
            }

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