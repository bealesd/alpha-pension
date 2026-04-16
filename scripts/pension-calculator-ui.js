import { TotalPension } from "./total-pension.js";

const DOM_IDS = Object.freeze({
    form: 'pension-form',
    age: 'age',
    retirementAge: 'retirement-age',
    pensionStartAge: 'pension-start-age',
    npa: 'npa',
    salary: 'salary',
    accrued: 'accrued',
    cpi: 'cpi',
    table: 'tbl',
    rowTemplate: 'added-pension-row',
    addRowButton: 'add-added-pension-row',
    resetButton: 'reset-form',
    pensionForecastValue: 'pension-forecast-value'
});

const DOM_CLASSES = Object.freeze({
    type: 'type',
    period: 'period',
    addedPensionPayment: 'added-pension-payment'
});

class PensionCalculatorUI {
    STORAGE_KEY = 'pensionCalculatorState';

    constructor() {
        this.form = document.getElementById(DOM_IDS.form);

        // Added pension table
        this.tableBody = document.querySelector(`#${DOM_IDS.table} tbody`);
        this.rowTemplate = document.getElementById(DOM_IDS.rowTemplate);

        this.addRowButton = document.getElementById(DOM_IDS.addRowButton);
        this.resetButton = document.getElementById(DOM_IDS.resetButton);

        // General pension inputs
        this.ageInput = document.getElementById(DOM_IDS.age);
        this.retirementAgeInput = document.getElementById(DOM_IDS.retirementAge);
        this.pensionStartAgeInput = document.getElementById(DOM_IDS.pensionStartAge);
        this.npaInput = document.getElementById(DOM_IDS.npa);
        this.salaryInput = document.getElementById(DOM_IDS.salary);
        this.accruedInput = document.getElementById(DOM_IDS.accrued);
        this.cpiInput = document.getElementById(DOM_IDS.cpi);

        // Pension forecast
        this.pensionForecastElement = document.getElementById(DOM_IDS.pensionForecastValue);

        this.addEventListeners();
        this.updatePensionStartAgeConstraints();

        this.loadState();

        this.form.dispatchEvent(new Event("input", { bubbles: true }));
    }

    addEventListeners() {
        document.addEventListener("input", (e) => {
            // Update pension start age constraints when retirement age changes
            if (e.target === this.retirementAgeInput) {
                this.updatePensionStartAgeConstraints();
                this.updateNpaConstraints();
            }

            if (e.target === this.pensionStartAgeInput)
                this.updateNpaConstraints();

            this.updatePensionForecast.call(this, e);
        });

        this.addRowButton.onclick = (e) => {
            e.preventDefault();
            this.tableBody.appendChild(this.rowTemplate.content.cloneNode(true));
            e.target.dispatchEvent(new Event("input", { bubbles: true }));
        };

        this.resetButton.onclick = (e) => {
            e.preventDefault();
            this.resetData();
            e.target.dispatchEvent(new Event("input", { bubbles: true }));
        };

        document.addEventListener("keydown", this.handleDataStepEvent.bind(this));
    }

    updatePensionStartAgeConstraints() {
        const retirementAge = +this.retirementAgeInput.value;
        // Pension start age cannot be earlier than retirement age
        this.pensionStartAgeInput.min = retirementAge;

        // If pension start age is now below retirement age, adjust it
        if (+this.pensionStartAgeInput.value < retirementAge)
            this.pensionStartAgeInput.value = retirementAge;
    }

    updateNpaConstraints() {
        // NPA cannot be earlier than pension start age
        const pensionStartAge = this.pensionStartAgeInput.value;
        this.npaInput.min = pensionStartAge;

        if (+this.npaInput.value < pensionStartAge)
            this.npaInput.value = pensionStartAge;
    }

    handleDataStepEvent(e) {
        if (e.target.tagName === "INPUT" && e.target.type === "number" && e.target.hasAttribute("data-step")) {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault(); // Stop the native step="1" behavior

                const jumpAmount = parseFloat(e.target.getAttribute("data-step"));
                const currentVal = parseFloat(e.target.value) || 0;

                // Apply the jump
                e.target.value = e.key === "ArrowUp" ? currentVal + jumpAmount : currentVal - jumpAmount;

                e.target.dispatchEvent(new Event("input", { bubbles: true }));
            }
        }
    }

    getRows() {
        return [...this.tableBody.querySelectorAll("tr")].map(row => ({
            type: row.querySelector(`.${DOM_CLASSES.type}`).value,
            period: row.querySelector(`.${DOM_CLASSES.period}`).value,
            addedPensionPayment: row.querySelector(`.${DOM_CLASSES.addedPensionPayment}`).value
        })).filter(row => {
            const payment = row.addedPensionPayment;
            return payment !== "" && Number(payment) !== 0;
        });
    }

    loadState() {
        const savedData = localStorage.getItem(this.STORAGE_KEY);
        if (!savedData) return;

        try {
            const state = JSON.parse(savedData);

            // Restore general inputs
            if (state.age !== undefined) this.ageInput.value = state.age;
            if (state.retirementAge !== undefined) this.retirementAgeInput.value = state.retirementAge;
            if (state.pensionStartAge !== undefined) this.pensionStartAgeInput.value = state.pensionStartAge;
            if (state.npa !== undefined) this.npaInput.value = state.npa;
            if (state.salary !== undefined) this.salaryInput.value = state.salary;
            if (state.accrued !== undefined) this.accruedInput.value = state.accrued;
            if (state.cpi !== undefined) this.cpiInput.value = state.cpi;

            // Restore dynamic rows
            if (state.rows && state.rows.length > 0) {
                this.tableBody.innerHTML = ""; // Clear out any default HTML rows

                state.rows.forEach(rowData => {
                    const rowNode = this.rowTemplate.content.cloneNode(true);
                    rowNode.querySelector(`.${DOM_CLASSES.type}`).value = rowData.type || "";
                    rowNode.querySelector(`.${DOM_CLASSES.period}`).value = rowData.period || "";
                    rowNode.querySelector(`.${DOM_CLASSES.addedPensionPayment}`).value = rowData.addedPensionPayment || "";
                    this.tableBody.appendChild(rowNode);
                });
            }

            // Validate pension start age is not before retirement age
            this.updatePensionStartAgeConstraints();
            this.updateNpaConstraints();
        } catch (e) {
            console.error("Failed to load pension calculator state from localStorage", e);
        }
    }

    saveState() {
        const state = {
            age: this.ageInput.value,
            retirementAge: this.retirementAgeInput.value,
            pensionStartAge: this.pensionStartAgeInput.value,
            npa: this.npaInput.value,
            salary: this.salaryInput.value,
            accrued: this.accruedInput.value,
            cpi: this.cpiInput.value,
            rows: this.getRows()
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    }

    resetData() {
        // 1. Clear local storage
        localStorage.removeItem(this.STORAGE_KEY);

        // 2. Reset form inputs back to their HTML default values
        if (this.form) this.form.reset();

        // 3. Clear all dynamic table rows
        this.tableBody.innerHTML = "";
    }

    updatePensionForecast(event) {
        // 1. If an input triggered this, check if it's valid.
        // If not, show native tooltip and stop calculation.
        if (event && event.target && event.target.tagName === "INPUT") {
            if (!event.target.checkValidity()) {
                event.target.reportValidity(); // Shows the native browser popup
                return; // Stop calculation
            }
        }

        // 2. Also check if the whole form is valid before saving/calculating
        if (this.form && !this.form.checkValidity()) {
            this.pensionForecastElement.textContent = "Error";
            return;
        }

        // Save the current state to localStorage every time an update occurs
        this.saveState();

        // Parse row values to numbers for the calculation
        const parsedRows = this.getRows().map(row => ({
            ...row,
            addedPensionPayment: +row.addedPensionPayment || 0
        }));

        const memberData = {
            age: +this.ageInput.value,
            retirementAge: +this.retirementAgeInput.value,
            pensionStartAge: +this.pensionStartAgeInput.value,
            npa: +this.npaInput.value,
            salary: +this.salaryInput.value,
            accrued: +this.accruedInput.value,
            cpi: +this.cpiInput.value / 100,
            rows: parsedRows
        };

        this.pensionForecastElement.textContent = (new TotalPension()).calculate(memberData).toFixed(0);
    }
}

// Instantiate the UI class when DOM is ready
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => new PensionCalculatorUI());
else
    new PensionCalculatorUI();
