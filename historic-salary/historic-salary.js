import { AddedPension } from "../scripts/added-pension.js";
import { cpiSeptember } from "../scripts/cpi-september.js";
import { Helpers } from "../scripts/helper.js";
import TableSorter from "../scripts/table-sorter.js";
import { EmployeeContributions } from "../scripts/employee-contributions.js";

const STORAGE_KEY = 'historicSalaryState';
const THEME_KEY = 'pensionCalculatorTheme';
const CONTRIBUTION_RATE = 0.0232;

const DOM_IDS = Object.freeze({
    themeToggle: 'theme-toggle'
});

class HistoricSalaryUI {
    constructor() {
        this.addedTableId = 'added-table';
        this.breakdownTableId = 'breakdown-table';
        this.salaryTableId = 'salary-table';

        this.themeToggle = document.getElementById(DOM_IDS.themeToggle);
        this.salaryTableBody = document.querySelector('#salary-table tbody');
        this.addedTableBody = document.querySelector('#added-table tbody');
        this.breakdownBody = document.querySelector('#breakdown-table tbody');
        this.addSalaryRowButton = document.getElementById('add-salary-row');
        this.addAddedRowButton = document.getElementById('add-added-row');
        this.totalSalary = document.getElementById('total-salary');
        this.totalAdded = document.getElementById('total-added');
        this.totalSalaryContributions = document.getElementById('total-salary-contributions');
        this.totalSalaryPension = document.getElementById('total-salary-pension');
        this.totalSalaryPension = document.getElementById('total-salary-pension');
        this.totalAddedPension = document.getElementById('total-added-pension');
        this.totalCombined = document.getElementById('total-combined');
        this.inflationInfo = document.getElementById('inflation-info');

        this.exportBtn = document.getElementById('exportBtn');
        this.importBtn = document.getElementById('importBtn');
        this.importFile = document.getElementById('importFile');

        this.dobInput = document.getElementById('dob');

        this.addedPension = new AddedPension();

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
        this.themeToggle.addEventListener("click", this.handleThemeToggle.bind(this));

        const inflationMax = Math.max(...Object.keys(cpiSeptember).map(Number));
        this.inflationInfo.textContent = `The calculator has no historical inflation figures for September ${inflationMax + 1} and beyond. Any calculation beyond ${inflationMax + 1} will not be adjusted for inflation.`;

        this.currentYear = Helpers.getCurrentYear();
        document.querySelectorAll('[data-bind="current-year"]').forEach(el => {
            el.textContent = `${this.currentYear}`.slice(-2);
        });

        this.loadTheme();
        this.loadState();
        this.update();

        this.addTableSortingForAp();
        this.addTableSortingForSalary();
    }

    loadTheme() {
        const saved = localStorage.getItem(THEME_KEY);
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const theme = saved ?? (prefersDark ? "dark" : "light");

        document.documentElement.setAttribute("data-theme", theme);
    }

    handleThemeToggle() {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";

        document.documentElement.setAttribute("data-theme", next);
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
        this.addAddedRow({ year: 2024, type: 'self', period: 'year', added: 0, actuaryVersion: '2025-02' });
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
        new TableSorter(this.addedTableId, {
            columns: {
                0: { sortable: true, type: 'number' },
                1: { sortable: true, type: 'string' },
                4: { sortable: true, type: 'number' }
            },
            defaultSort: { index: 0, direction: 'asc' }
        });
    }

    addTableSortingForSalary() {
        new TableSorter(this.salaryTableId, {
            columns: {
                0: { sortable: true, type: 'number' },
                1: { sortable: true, type: 'number' },
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

        tr.querySelector('.actuary-version').value = data.actuaryVersion || '2025-02';
        tr.querySelector('.year').value = data.year || 2024;
        tr.querySelector('.type').value = data.type || 'dependants';
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
            .map(row => {
                return {
                    year: Number(row.querySelector('.year').value) || 0,
                    actuaryVersion: row.querySelector('.actuary-version').value,
                    type: row.querySelector('.type').value,
                    period: row.querySelector('.period').value,
                    added: Number(row.querySelector('.added').value) || 0
                };
            })
            .filter(row => row.year > 0)
            .sort((a, b) => a.year - b.year);
    }

    getSettings() {
        const dob = Temporal.PlainDate.from(this.dobInput.value || "19800101");
        return { dob };
    }

    getAgeForRow(row, settings) {
        return settings.currentAge - (this.currentYear - row.year);
    }

    estimateSalaryPension(row) {
        return row.salary * CONTRIBUTION_RATE;
    }

    estimateAddedPension(purchased, row, dob, schemaStartYear) {
        return this.addedPension.calculateAddedPensionForYearForGivenAge(purchased, row.type, dob, schemaStartYear, row.actuaryVersion);
    }

    calculateLedgerRow(year, currentBalance, newContributions) {
        const opening = currentBalance;
        const openingAdjusted = Helpers.getSingleYearCpiAdjustedValue(year, opening);
        const addedAdjusted = Helpers.getSingleYearCpiAdjustedValue(year, newContributions);

        const inflationChange = (openingAdjusted - opening) + (addedAdjusted - newContributions);
        const closing = openingAdjusted + addedAdjusted;

        return { opening, inflationChange, closing };
    }

    getYearlySpSummary(salaryRow, schemeStartDate) {
        const input = salaryRow ? salaryRow.salary : 0;
        const unadjusted = salaryRow ? this.estimateSalaryPension(salaryRow) : 0;
        const adjustedToPresent = Helpers.getCpiAdjustedValue(schemeStartDate.year, unadjusted, this.currentYear);

        return { input, unadjusted, adjustedToPresent };
    }

    getYearlyApSummary(addedRowsForYear, dob, schemeStartDate) {
        return addedRowsForYear.reduce((acc, row) => {
            const purchasedAp = row.period === 'month' ? row.added * 12 : row.added;
            const amount = this.estimateAddedPension(purchasedAp, row, dob, schemeStartDate.year);

            acc.input += purchasedAp;
            acc.unadjusted += amount;
            acc.adjustedToPresent += Helpers.getCpiAdjustedValue(schemeStartDate.year, amount, this.currentYear);

            return acc;
        }, { input: 0, unadjusted: 0, adjustedToPresent: 0 });
    }

    update() {
        const settings = this.getSettings();
        const salaryRows = this.getSalaryRows();
        const addedRows = this.getAddedRows();

        const salaryByYear = Object.fromEntries(salaryRows.map(r => [r.year, r]));
        const addedByYear = addedRows.reduce((acc, row) => {
            (acc[row.year] = acc[row.year] || []).push(row);
            return acc;
        }, {});

        const allYears = [...new Set([...Object.keys(salaryByYear), ...Object.keys(addedByYear)])]
            .map(Number)
            .sort((a, b) => a - b);

        let totalSalaryPension = 0;
        let totalAddedPension = 0;

        const detailedRows = allYears.map(year => {
            const schemeDates = Helpers.getSchemeDatesForYear(year);
            const age = Helpers.getAgeAtDate(settings.dob, schemeDates.schemeStartDate);

            // Extract math to symmetrical helpers
            const sp = this.getYearlySpSummary(salaryByYear[year], schemeDates.schemeStartDate);
            const ap = this.getYearlyApSummary(addedByYear[year] || [], settings.dob, schemeDates.schemeStartDate);

            totalSalaryPension += sp.adjustedToPresent;
            totalAddedPension += ap.adjustedToPresent;

            return {
                year,
                age,
                sp,
                ap,
                totalAdjustedToPresent: sp.adjustedToPresent + ap.adjustedToPresent
            };
        });

        this.updateUI({
            totalSalary: detailedRows.reduce((sum, r) => sum + r.sp.input, 0),
            totalSalaryContributions: detailedRows.reduce((sum, r) => sum + r.sp.outOfPocketCost, 0),
            totalAdded: detailedRows.reduce((sum, r) => sum + r.ap.input, 0),
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
        let closingApAdjustedToPresentYear = 0;
        let currentAp = 0;

        for (const row of rows) {
            const cpi = Helpers.getSingleYearCpi(row.year);

            // Total
            cumulativePensionAdjustedToPresentYear += row.totalAdjustedToPresent;

            // SP Calculations
            closingSpAdjustedToPresentYear += row.sp.adjustedToPresent;
            const spLedger = this.calculateLedgerRow(row.year, currentSp, row.sp.unadjusted);
            currentSp = spLedger.closing;

            // AP Calculations
            closingApAdjustedToPresentYear += row.ap.adjustedToPresent;
            const apLedger = this.calculateLedgerRow(row.year, currentAp, row.ap.unadjusted);
            currentAp = apLedger.closing;

            // Year Labels
            const startYearLastTwo = `${row.year}`.slice(-2);
            const endYearLastTwo = `${row.year + 1}`.slice(-2);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${startYearLastTwo}/${endYearLastTwo}</td>
                <td>${row.age}</td>

                <td>${this.formatCurrency(spLedger.opening)}</td>
                <td>${this.formatCurrency(row.sp.input)}</td>     
                <td>${this.formatCurrency(row.sp.unadjusted)}</td>
                <td>${(cpi || 0).toFixed(1)}</td>
                <td>${this.formatCurrency(spLedger.inflationChange)}</td>
                <td>${this.formatCurrency(spLedger.closing)}</td> 

                <td>${this.formatCurrency(row.sp.adjustedToPresent)}</td>       
                <td>${this.formatCurrency(closingSpAdjustedToPresentYear)}</td>   

                <td>${this.formatCurrency(apLedger.opening)}</td>
                <td>${this.formatCurrency(row.ap.input)}</td>     
                <td>${this.formatCurrency(row.ap.unadjusted)}</td>
                <td>${this.formatCurrency(apLedger.inflationChange)}</td>
                <td>${this.formatCurrency(apLedger.closing)}</td> 

                <td>${this.formatCurrency(row.ap.adjustedToPresent)}</td>       
                <td>${this.formatCurrency(closingApAdjustedToPresentYear)}</td>         

                <td>${this.formatCurrency(row.totalAdjustedToPresent)}</td>
                <td>${this.formatCurrency(cumulativePensionAdjustedToPresentYear)}</td>
            `;
            this.breakdownBody.appendChild(tr);
        }

        new TableSorter(this.breakdownTableId, {
            searchable: true,
            searchPlaceholder: 'Search years, age...',
            columns: {
                0: { sortable: true, type: 'number' },
                1: { sortable: true, type: 'number' },
                2: { sortable: true, type: 'number' },
                3: { sortable: true, type: 'number' },
                4: { sortable: true, type: 'number' },
                5: { sortable: true, type: 'number' },
                6: { sortable: true, type: 'number' },
                7: { sortable: true, type: 'number' },
                8: { sortable: true, type: 'number' },
                9: { sortable: true, type: 'number' },
                10: { sortable: true, type: 'number' },
                11: { sortable: true, type: 'number' },
                12: { sortable: true, type: 'number' },
                13: { sortable: true, type: 'number' },
            },
            defaultSort: {
                index: 0,
                direction: 'asc'
            }
        });
    }

    getYearlySpSummary(salaryRow, schemeStartDate) {
        const input = salaryRow ? salaryRow.salary : 0;
        const unadjusted = salaryRow ? this.estimateSalaryPension(salaryRow) : 0;
        const adjustedToPresent = Helpers.getCpiAdjustedValue(schemeStartDate.year, unadjusted, this.currentYear);

        const outOfPocketCost = EmployeeContributions.calculateCost(schemeStartDate.year, input);

        return { input, unadjusted, adjustedToPresent, outOfPocketCost };
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ salaryRows, addedRows, settings }));
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
            this.update();
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