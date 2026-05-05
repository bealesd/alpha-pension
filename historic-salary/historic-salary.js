import { AddedPension } from "../scripts/added-pension.js";
import { cpiSeptember } from "../scripts/cpi-september.js";
import { Helpers } from "../scripts/helper.js";
import TableSorter from "../scripts/table-sorter.js";

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

                // Save it to localStorage so your normal loadState() can pick it up
                localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedState));

                // Trigger your existing load method
                this.loadState();

                alert('Settings imported successfully!');
            } catch (err) {
                alert('Invalid file format. Please upload a valid JSON backup.');
                console.error(err);
            }
        };

        // Read the file as text
        reader.readAsText(file);

        // Reset the input so they can import the same file again if needed
        e.target.value = '';
    }

    handleAddSalaryRow(event) {
        event.preventDefault();
        this.addSalaryRow({ year: 2024, salary: 0 });
        this.update();
    }

    handleAddAddedRow(event) {
        event.preventDefault();
        this.addAddedRow({ year: 2024, type: 'self', period: 'year', added: 0 });
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
            // Define which columns are sortable.
            // Index 0 = Year, Index 1 = Actuary, Index 4 = Added Pension
            columns: {
                0: { sortable: true, type: 'number' },
                1: { sortable: true, type: 'string' },
                4: { sortable: true, type: 'number' }
            },
            // Set the default sort on page load (sort by Year, Ascending)
            defaultSort: {
                index: 0,
                direction: 'asc'
            }
        });
    }

    addTableSortingForSalary() {
        new TableSorter(this.salaryTableId, {
            // Define which columns are sortable.
            // Index 0 = Year, Index 1 = Actuary, Index 4 = Added Pension
            columns: {
                0: { sortable: true, type: 'number' },
                1: { sortable: true, type: 'number' },
            },
            // Set the default sort on page load (sort by Year, Ascending)
            defaultSort: {
                index: 0,
                direction: 'asc'
            }
        });
    }

    addSalaryRow(data) {
        const template = document.getElementById('salary-row');
        const row = template.content.cloneNode(true);
        const tr = row.querySelector('tr');

        tr.querySelector('.year').value = data.year;
        tr.querySelector('.salary').value = data.salary;

        this.salaryTableBody.appendChild(tr);
    }

    addAddedRow(data) {
        const template = document.getElementById('added-row');
        const row = template.content.cloneNode(true);
        const tr = row.querySelector('tr');

        tr.querySelector('.actuary-version').value = data.actuaryVersion;
        tr.querySelector('.year').value = data.year;
        tr.querySelector('.type').value = data.type;
        tr.querySelector('.period').value = data.period;
        tr.querySelector('.added').value = data.added;

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
                const period = row.querySelector('.period').value;
                const added = Number(row.querySelector('.added').value) || 0;

                return {
                    year: Number(row.querySelector('.year').value) || 0,
                    actuaryVersion: row.querySelector('.actuary-version').value,
                    type: row.querySelector('.type').value,
                    period,
                    added,
                    annualAdded: period === 'month' ? added * 12 : added
                };
            })
            .filter(row => row.year > 0)
            .sort((a, b) => a.year - b.year);
    }

    getSettings() {
        // const currentYear = Number(this.currentYearInput.value) || 2024;
        const dob = Temporal.PlainDate.from(this.dobInput.value || "19800101");
        const currentYear = Helpers.getCurrentYear();
        return {
            currentYear,
            dob
        };
    }

    getAgeForRow(row, settings) {
        return settings.currentAge - (settings.currentYear - row.year);
    }

    estimateSalaryPension(row) {
        return row.salary * CONTRIBUTION_RATE;
    }

    estimateAddedPension(row, dob, schemaStartYear) {
        //totalContributionsForPeriod, type, dob, schemaStartYear
        return this.addedPension.calculateAddedPensionForYearForGivenAge(row.annualAdded, row.type, dob, schemaStartYear, row.actuaryVersion);
    }

    update() {
        const settings = this.getSettings();
        const salaryRows = this.getSalaryRows();
        const addedRows = this.getAddedRows();

        // 1. Create lookups for quick access
        const salaryByYear = Object.fromEntries(salaryRows.map(r => [r.year, r]));
        const addedByYear = addedRows.reduce((acc, row) => {
            (acc[row.year] = acc[row.year] || []).push(row);
            return acc;
        }, {});

        // 2. Get a unique list of all years from both datasets
        const allYears = [...new Set([...salaryRows.map(r => r.year), ...Object.keys(addedByYear).map(Number)])].sort((a, b) => a - b);

        let totalSalaryPension = 0;
        let totalAddedPension = 0;

        const detailedRows = allYears.map(year => {
            const salaryRow = salaryByYear[year];
            const addedForYear = addedByYear[year] || [];
            const schemeDates = Helpers.getSchemeDatesForYear(year);
            const age = Helpers.getAgeAtDate(settings.dob, schemeDates.schemeStartDate);

            // Calculate Salary Pension
            const salaryVal = salaryRow ? this.estimateSalaryPension(salaryRow) : 0;
            const salaryValAdj = salaryRow ? Helpers.getCpiAdjustedValue(schemeDates.schemeStartDate.year, salaryVal, settings.currentYear) : 0;

            // Calculate Added Pension (Logic now lives in one place)
            let addedVal = 0;
            let addedValAdj = 0;

            addedForYear.forEach(row => {
                const amount = this.estimateAddedPension(row, settings.dob, schemeDates.schemeStartDate.year);
                addedVal += amount;
                addedValAdj += Helpers.getCpiAdjustedValue(schemeDates.schemeStartDate.year, amount, settings.currentYear);
            });

            totalSalaryPension += salaryValAdj;
            totalAddedPension += addedValAdj;

            return {
                year,
                age,
                salary: salaryRow?.salary || 0,
                ap: addedForYear.reduce((sum, r) => sum + r.annualAdded, 0),
                salaryPensionAdjusted: salaryValAdj,
                salaryPensionUnadjusted: salaryVal,
                addedPensionAdjusted: addedValAdj,
                addedPensionUnadjusted: addedVal,
                totalValue: salaryValAdj + addedValAdj
            };
        });

        // 3. Update UI and State
        this.updateUI({
            totalSalary: salaryRows.reduce((sum, r) => sum + r.salary, 0),
            totalAdded: addedRows.reduce((sum, r) => sum + r.annualAdded, 0),
            salaryPension: totalSalaryPension,
            addedPension: totalAddedPension
        });

        this.renderBreakdown(detailedRows);
        this.saveState(salaryRows, addedRows, settings);
    }

    // Optional: Helper to keep the UI logic out of the main calculation
    updateUI(totals) {
        this.totalSalary.textContent = this.formatCurrency(totals.totalSalary);
        this.totalAdded.textContent = this.formatCurrency(totals.totalAdded);
        this.totalSalaryPension.textContent = this.formatCurrency(totals.salaryPension);
        this.totalAddedPension.textContent = this.formatCurrency(totals.addedPension);
        this.totalCombined.textContent = this.formatCurrency(totals.salaryPension + totals.addedPension);
    }

    renderBreakdown(rows) {
        this.breakdownBody.innerHTML = '';
        let pensionTotal = 0;
        let salaryPensionTotal = 0;
        let apTotalPrevious = 0;

        let i = 0;
        for (const row of rows) {
            pensionTotal += row.totalValue;
            salaryPensionTotal += row.salaryPensionAdjusted;

            let openingAp = apTotalPrevious;
            const cpi = Helpers.getSingleYearCpi(row.year);

            const unadjustedTotalAp = row.addedPensionUnadjusted + apTotalPrevious;
            const adjustedTotalAp = Helpers.getSingleYearCpiAdjustedValue(row.year, unadjustedTotalAp);

            const increaseInOpeningApThroughInflation = adjustedTotalAp - unadjustedTotalAp;
            apTotalPrevious = adjustedTotalAp;

            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${row.year}</td>
                <td>${row.age}</td>
                <td>${this.formatCurrency(row.salary)}</td>
                <td>${this.formatCurrency(row.salaryPensionUnadjusted)}</td>
                <td>${this.formatCurrency(row.salaryPensionAdjusted)}</td>       
                <td>${this.formatCurrency(salaryPensionTotal)}</td>   

                <td>${this.formatCurrency(openingAp)}</td>     
                <td>${this.formatCurrency(row.ap)}</td>
                <td>${this.formatCurrency(row.addedPensionUnadjusted)}</td>
                <td>${cpi.toFixed(1)}</td>
                <td>${this.formatCurrency(increaseInOpeningApThroughInflation)}</td>
                <td>${this.formatCurrency(apTotalPrevious)}</td>

                <td>${this.formatCurrency(row.totalValue)}</td>
                <td>${this.formatCurrency(pensionTotal)}</td>
            `;
            this.breakdownBody.appendChild(tr);

            i++;
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
        } catch (error) {
            console.warn('Failed to load historic salary state', error);
        }
    }

    exportState() {
        // 1. Grab the latest state directly from localStorage
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            alert('No settings found to export.');
            return;
        }

        // 2. We parse and re-stringify with formatting (null, 2) 
        //    so the downloaded file is pretty-printed and human-readable.
        try {
            const state = JSON.parse(saved);
            const prettyJsonString = JSON.stringify(state, null, 2);

            // 3. Create the file and trigger download
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
