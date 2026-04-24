import { AddedPension } from "../scripts/added-pension.js";

const STORAGE_KEY = 'historicSalaryState';
const CONTRIBUTION_RATE = 0.0232;

class HistoricSalaryUI {
    constructor() {
        this.cacheElements();
        this.addedPension = new AddedPension();
        this.initEventListeners();
        
        // Load existing data if available
        this.loadState();

        // Calculate initial totals/render based on loaded state
        this.update();
    }

    cacheElements() {
        const query = (selector) => document.querySelector(selector);
        this.salaryTableBody = query('#salary-table tbody');
        this.addedTableBody = query('#added-table tbody');
        this.breakdownBody = query('#breakdown-table tbody');
        
        this.addSalaryRowButton = query('#add-salary-row');
        this.addAddedRowButton = query('#add-added-row');
        
        this.totalSalary = query('#total-salary');
        this.totalAdded = query('#total-added');
        this.totalSalaryPension = query('#total-salary-pension');
        this.totalAddedPension = query('#total-added-pension');
        this.totalCombined = query('#total-combined');

        this.currentYearInput = query('#current-year');
        this.yearOfBirthInput = query('#year-of-birth');
        this.monthOfBirthInput = query('#month-of-birth');
        this.npaInput = query('#npa');
    }

    initEventListeners() {
        this.addSalaryRowButton.addEventListener('click', (e) => { 
            e.preventDefault(); 
            this.addSalaryRow({ year: new Date().getFullYear(), salary: 0 }); 
            this.update(); 
        });

        this.addAddedRowButton.addEventListener('click', (e) => { 
            e.preventDefault(); 
            this.addAddedRow({ year: new Date().getFullYear(), type: 'self', period: 'year', added: 0 }); 
            this.update(); 
        });
        
        [this.salaryTableBody, this.addedTableBody].forEach(body => {
            body.addEventListener('input', () => this.update());
            body.addEventListener('click', (e) => this.handleRemoveRow(e));
        });

        [this.currentYearInput, this.yearOfBirthInput, this.monthOfBirthInput, this.npaInput].forEach(input => {
            input?.addEventListener('input', () => this.update());
        });
    }

    // --- Row Handling ---

    handleRemoveRow(event) {
        if (!event.target.classList.contains('remove-row')) return;
        event.target.closest('tr').remove();
        this.update();
    }

    addSalaryRow(data) {
        const row = document.getElementById('salary-row').content.cloneNode(true).querySelector('tr');
        row.querySelector('.year').value = data.year;
        row.querySelector('.salary').value = data.salary;
        this.salaryTableBody.appendChild(row);
    }

    addAddedRow(data) {
        const row = document.getElementById('added-row').content.cloneNode(true).querySelector('tr');
        row.querySelector('.year').value = data.year;
        row.querySelector('.type').value = data.type;
        row.querySelector('.period').value = data.period;
        row.querySelector('.added').value = data.added;
        this.addedTableBody.appendChild(row);
    }

    // --- Age Logic ---

    getDecimalAgeTemporal(dobMonth, dobYear, financialYearStartYear) {
        // Precise calculation for April 1st of the financial year
        const birthDate = Temporal.PlainDate.from({ year: dobYear, month: dobMonth, day: 1 });
        const referenceDate = Temporal.PlainDate.from({ year: financialYearStartYear, month: 4, day: 1 });
        const duration = referenceDate.since(birthDate);
        return parseFloat(duration.total({ unit: 'year', relativeTo: birthDate }).toFixed(4));
    }

    // --- Calculations ---

    getSettings() {
        return {
            currentYear: Number(this.currentYearInput.value) || new Date().getFullYear(),
            yearOfBirth: Number(this.yearOfBirthInput.value) || 1986,
            monthOfBirth: Number(this.monthOfBirthInput?.value) || 1,
            npa: Number(this.npaInput.value) || 68
        };
    }

    update() {
        const settings = this.getSettings();
        const salaryRows = this.getSalaryRows();
        const addedRows = this.getAddedRows();

        // Group added pensions by year
        const addedByYear = addedRows.reduce((acc, row) => {
            if (!acc[row.year]) acc[row.year] = [];
            acc[row.year].push(row);
            return acc;
        }, {});

        // Unique set of all years to iterate once
        const allYears = [...new Set([
            ...salaryRows.map(r => r.year),
            ...Object.keys(addedByYear).map(Number)
        ])].sort((a, b) => a - b);

        let totalSalaryValue = 0;
        let totalAddedValue = 0;
        let totalSalaryPensionValue = 0;
        let totalAddedPensionValue = 0;

        const detailedRows = [];

        for (const year of allYears) {
            const salaryRow = salaryRows.find(r => r.year === year);
            const addedItems = addedByYear[year] || [];
            
            const age = this.getDecimalAgeTemporal(settings.monthOfBirth, settings.yearOfBirth, year);
            
            // Salary calculation
            const salary = salaryRow ? salaryRow.salary : 0;
            const salaryPension = salary * CONTRIBUTION_RATE;

            // Added pension calculation
            let annualAddedTotal = 0;
            let addedPensionValue = 0;

            for (const item of addedItems) {
                annualAddedTotal += item.annualAdded;
                addedPensionValue += this.addedPension.calculateAddedPensionForYearForGivenAge(
                    item.annualAdded, age, item.type, settings.npa
                );
            }

            totalSalaryValue += salary;
            totalAddedValue += annualAddedTotal;
            totalSalaryPensionValue += salaryPension;
            totalAddedPensionValue += addedPensionValue;

            detailedRows.push({
                year,
                age,
                salary,
                added: annualAddedTotal,
                salaryPension,
                addedPension: addedPensionValue,
                totalValue: salaryPension + addedPensionValue
            });
        }

        // UI Updates
        this.totalSalary.textContent = this.formatCurrency(totalSalaryValue);
        this.totalAdded.textContent = this.formatCurrency(totalAddedValue);
        this.totalSalaryPension.textContent = this.formatCurrency(totalSalaryPensionValue);
        this.totalAddedPension.textContent = this.formatCurrency(totalAddedPensionValue);
        this.totalCombined.textContent = this.formatCurrency(totalSalaryPensionValue + totalAddedPensionValue);

        this.renderBreakdown(detailedRows);
        this.saveState(salaryRows, addedRows, settings);
    }

    renderBreakdown(rows) {
        this.breakdownBody.innerHTML = '';
        let previousTotal = 0;

        for (const row of rows) {
            const change = previousTotal ? row.totalValue - previousTotal : 0;
            const pensionYear = `${row.year}/${(row.year + 1).toString().slice(-2)}`;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${pensionYear}</td>
                <td>${row.age.toFixed(2)}</td>
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

    // --- Helpers ---

    getSalaryRows() {
        return [...this.salaryTableBody.querySelectorAll('tr')].map(row => ({
            year: Number(row.querySelector('.year').value) || 0,
            salary: Number(row.querySelector('.salary').value) || 0
        })).filter(r => r.year > 0);
    }

    getAddedRows() {
        return [...this.addedTableBody.querySelectorAll('tr')].map(row => {
            const period = row.querySelector('.period').value;
            const added = Number(row.querySelector('.added').value) || 0;
            return {
                year: Number(row.querySelector('.year').value) || 0,
                type: row.querySelector('.type').value,
                period,
                annualAdded: period === 'month' ? added * 12 : added
            };
        }).filter(r => r.year > 0);
    }

    formatCurrency(v) { 
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(v); 
    }

    formatSigned(v) { 
        return (v > 0 ? '+' : '') + this.formatCurrency(v); 
    }

    saveState(salaryRows, addedRows, settings) { 
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ salaryRows, addedRows, settings })); 
    }

    loadState() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        try {
            const { salaryRows, addedRows, settings } = JSON.parse(saved);
            if (settings) {
                this.currentYearInput.value = settings.currentYear;
                this.yearOfBirthInput.value = settings.yearOfBirth;
                this.npaInput.value = settings.npa;
                if (this.monthOfBirthInput) this.monthOfBirthInput.value = settings.monthOfBirth;
            }
            if (salaryRows) { 
                this.salaryTableBody.innerHTML = ''; 
                salaryRows.forEach(r => this.addSalaryRow(r)); 
            }
            if (addedRows) { 
                this.addedTableBody.innerHTML = ''; 
                addedRows.forEach(r => this.addAddedRow(r)); 
            }
        } catch (e) { 
            console.warn('Load failed', e); 
        }
    }
}

new HistoricSalaryUI();
