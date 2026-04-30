import { AddedPension } from "../scripts/added-pension.js";
import { Helpers } from "../scripts/helper.js";

const STORAGE_KEY = 'historicSalaryState';
const CONTRIBUTION_RATE = 0.0232;

class HistoricSalaryUI {
    constructor() {
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

        this.currentYearInput = document.getElementById('current-year');
        this.dobInput = document.getElementById('dob');


        this.addedPension = new AddedPension();

        this.addSalaryRowButton.addEventListener('click', this.handleAddSalaryRow.bind(this));
        this.addAddedRowButton.addEventListener('click', this.handleAddAddedRow.bind(this));
        this.salaryTableBody.addEventListener('input', this.handleInput.bind(this));
        this.salaryTableBody.addEventListener('click', this.handleRemoveRow.bind(this));
        this.addedTableBody.addEventListener('input', this.handleInput.bind(this));
        this.addedTableBody.addEventListener('click', this.handleRemoveRow.bind(this));

        this.currentYearInput.addEventListener('input', this.handleInput.bind(this));
        this.dobInput.addEventListener('input', this.handleInput.bind(this));

        this.loadState();
        if (this.salaryTableBody.children.length === 0) {
            this.addSalaryRow({ year: new Date().getFullYear() - 2, salary: 30000 });
            this.addSalaryRow({ year: new Date().getFullYear() - 1, salary: 35000 });
            this.addSalaryRow({ year: new Date().getFullYear(), salary: 38000 });
        }
        this.update();
    }

    handleAddSalaryRow(event) {
        event.preventDefault();
        this.addSalaryRow({ year: new Date().getFullYear(), salary: 0 });
        this.update();
    }

    handleAddAddedRow(event) {
        event.preventDefault();
        this.addAddedRow({ year: new Date().getFullYear(), type: 'self', period: 'year', added: 0 });
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
        const currentYear = Number(this.currentYearInput.value) || new Date().getFullYear();
        const dob = Temporal.PlainDate.from(this.dobInput.value || "19800101");
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

        // Group added by year
        const addedByYear = {};
        addedRows.forEach(row => {
            if (!addedByYear[row.year]) addedByYear[row.year] = [];
            addedByYear[row.year].push(row);
        });

        const totalSalary = salaryRows.reduce((sum, row) => sum + row.salary, 0);
        const totalAdded = addedRows.reduce((sum, row) => sum + row.annualAdded, 0);

        let salaryPension = 0;
        let addedPensionValue = 0;

        const detailedRows = salaryRows.map(salaryRow => {
            const schemeYearDates = Helpers.getSchemeDatesForYear(salaryRow.year);
            const age = Helpers.getAgeAtDate(settings.dob, schemeYearDates.schemeStartDate);

            const salaryValue = this.estimateSalaryPension(salaryRow);
            const addedForYear = addedByYear[salaryRow.year] || [];
            const addedValue = addedForYear.reduce((sum, addedRow) => sum + this.estimateAddedPension(addedRow, settings.dob, schemeYearDates.schemeStartDate.year), 0);
            salaryPension += salaryValue;
            addedPensionValue += addedValue;
            return {
                year: salaryRow.year,
                age,
                salary: salaryRow.salary,
                added: addedForYear.reduce((sum, row) => sum + row.annualAdded, 0),
                salaryPension: salaryValue,
                addedPension: addedValue,
                totalValue: salaryValue + addedValue
            };
        });

        // Handle years with added but no salary
        Object.keys(addedByYear).forEach(yearStr => {
            const year = Number(yearStr);
            const schemeYearDates = Helpers.getSchemeDatesForYear(year);
            if (!salaryRows.find(r => r.year === year)) {
                const age = Helpers.getAgeAtDate(settings.dob, schemeYearDates.schemeStartDate);

                const addedValue = addedByYear[year].reduce((sum, addedRow) => sum + this.estimateAddedPension(addedRow, settings.dob, schemeYearDates.schemeStartDate.year), 0);
                addedPensionValue += addedValue;
                detailedRows.push({
                    year,
                    age,
                    salary: 0,
                    added: addedByYear[year].reduce((sum, row) => sum + row.annualAdded, 0),
                    salaryPension: 0,
                    addedPension: addedValue,
                    totalValue: addedValue
                });
            }
        });

        detailedRows.sort((a, b) => a.year - b.year);

        const combinedPension = salaryPension + addedPensionValue;

        this.totalSalary.textContent = this.formatCurrency(totalSalary);
        this.totalAdded.textContent = this.formatCurrency(totalAdded);
        this.totalSalaryPension.textContent = this.formatCurrency(salaryPension);
        this.totalAddedPension.textContent = this.formatCurrency(addedPensionValue);
        this.totalCombined.textContent = this.formatCurrency(combinedPension);

        this.renderBreakdown(detailedRows);
        this.saveState(salaryRows, addedRows, settings);
    }

    renderBreakdown(rows) {
        this.breakdownBody.innerHTML = '';
        let previousTotal = 0;

        for (const row of rows) {
            const change = previousTotal ? row.totalValue - previousTotal : 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.year}</td>
                <td>${row.age}</td>
                <td>${this.formatCurrency(row.salary)}</td>
                <td>${this.formatCurrency(row.added)}</td>
                <td>${this.formatCurrency(row.salaryPension)}</td>
                <td>${this.formatCurrency(row.addedPension)}</td>
                <td>${this.formatCurrency(row.totalValue)}</td>
                <td>${change === 0 ? '—' : this.formatSigned(change)}</td>
            `;
            this.breakdownBody.appendChild(tr);
            previousTotal = row.totalValue;
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ salaryRows, addedRows, settings }));
    }

    loadState() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        try {
            const state = JSON.parse(saved);
            if (state.settings) {
                this.currentYearInput.value = state.settings.currentYear ?? this.currentYearInput.value;
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
}

new HistoricSalaryUI();
