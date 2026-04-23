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
    addedPensionPayment: 'added-pension-payment',
    removeRow: 'remove-row'
});

class PensionCalculatorUI {
    STORAGE_KEY = 'pensionCalculatorState';

    constructor() {
        this.form = document.getElementById(DOM_IDS.form);
        this.tableBody = document.querySelector(`#${DOM_IDS.table} tbody`);
        this.rowTemplate = document.getElementById(DOM_IDS.rowTemplate);
        this.addRowButton = document.getElementById(DOM_IDS.addRowButton);
        this.resetButton = document.getElementById(DOM_IDS.resetButton);

        this.ageInput = document.getElementById(DOM_IDS.age);
        this.retirementAgeInput = document.getElementById(DOM_IDS.retirementAge);
        this.pensionStartAgeInput = document.getElementById(DOM_IDS.pensionStartAge);
        this.npaInput = document.getElementById(DOM_IDS.npa);
        this.salaryInput = document.getElementById(DOM_IDS.salary);
        this.accruedInput = document.getElementById(DOM_IDS.accrued);
        this.cpiInput = document.getElementById(DOM_IDS.cpi);

        this.pensionForecastElement = document.getElementById(DOM_IDS.pensionForecastValue);

        this.addEventListeners();
        this.updatePensionStartAgeConstraints();
        this.loadState();
        this.form.dispatchEvent(new Event("input", { bubbles: true }));
    }

    addEventListeners() {
        document.addEventListener("input", this.handleInput.bind(this));
        document.addEventListener("keydown", this.handleDataStepEvent.bind(this));
        this.addRowButton.addEventListener("click", this.handleAddRow.bind(this));
        this.resetButton.addEventListener("click", this.handleReset.bind(this));
        this.tableBody.addEventListener("click", this.handleRemoveRow.bind(this));
    }

    handleInput(e) {
        if (e.target === this.retirementAgeInput) {
            this.updatePensionStartAgeConstraints();
            this.updateNpaConstraints();
        }

        if (e.target === this.pensionStartAgeInput) {
            this.updateNpaConstraints();
        }

        this.updatePensionForecast(e);
    }

    handleAddRow(e) {
        e.preventDefault();
        this.tableBody.appendChild(this.rowTemplate.content.cloneNode(true));
        this.updatePensionForecast();
    }

    handleReset(e) {
        e.preventDefault();
        this.resetData();
        this.updatePensionForecast();
    }

    handleRemoveRow(e) {
        const removeButton = e.target.closest(`.${DOM_CLASSES.removeRow}`);
        if (!removeButton) return;

        removeButton.closest("tr").remove();
        this.updatePensionForecast();
    }

    handleDataStepEvent(e) {
        const { target, key } = e;

        if (target.tagName !== "INPUT" || target.type !== "number" || !target.hasAttribute("data-step")) return;
        if (key !== "ArrowUp" && key !== "ArrowDown") return;

        e.preventDefault();

        const step = parseFloat(target.getAttribute("data-step"));
        const current = parseFloat(target.value) || 0;
        target.value = key === "ArrowUp" ? current + step : current - step;

        target.dispatchEvent(new Event("input", { bubbles: true }));
    }

    updatePensionStartAgeConstraints() {
        const retirementAge = +this.retirementAgeInput.value;
        this.pensionStartAgeInput.min = retirementAge;

        if (+this.pensionStartAgeInput.value < retirementAge) {
            this.pensionStartAgeInput.value = retirementAge;
        }
    }

    updateNpaConstraints() {
        const pensionStartAge = +this.pensionStartAgeInput.value;
        this.npaInput.min = pensionStartAge;

        if (+this.npaInput.value < pensionStartAge) {
            this.npaInput.value = pensionStartAge;
        }
    }

    getRows() {
        return [...this.tableBody.querySelectorAll("tr")]
            .map(row => ({
                type: row.querySelector(`.${DOM_CLASSES.type}`).value,
                period: row.querySelector(`.${DOM_CLASSES.period}`).value,
                addedPensionPayment: row.querySelector(`.${DOM_CLASSES.addedPensionPayment}`).value
            }))
            .filter(row => row.addedPensionPayment !== "" && Number(row.addedPensionPayment) !== 0);
    }

    loadState() {
        const savedData = localStorage.getItem(this.STORAGE_KEY);
        if (!savedData) return;

        try {
            const state = JSON.parse(savedData);

            this.ageInput.value = state.age ?? this.ageInput.value;
            this.retirementAgeInput.value = state.retirementAge ?? this.retirementAgeInput.value;
            this.pensionStartAgeInput.value = state.pensionStartAge ?? this.pensionStartAgeInput.value;
            this.npaInput.value = state.npa ?? this.npaInput.value;
            this.salaryInput.value = state.salary ?? this.salaryInput.value;
            this.accruedInput.value = state.accrued ?? this.accruedInput.value;
            this.cpiInput.value = state.cpi ?? this.cpiInput.value;

            if (state.rows?.length > 0) {
                this.tableBody.innerHTML = "";

                for (const rowData of state.rows) {
                    const rowNode = this.rowTemplate.content.cloneNode(true);
                    rowNode.querySelector(`.${DOM_CLASSES.type}`).value = rowData.type || "";
                    rowNode.querySelector(`.${DOM_CLASSES.period}`).value = rowData.period || "";
                    rowNode.querySelector(`.${DOM_CLASSES.addedPensionPayment}`).value = rowData.addedPensionPayment || "";
                    this.tableBody.appendChild(rowNode);
                }
            }

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
        localStorage.removeItem(this.STORAGE_KEY);
        this.form?.reset();
        this.tableBody.innerHTML = "";
    }

    updatePensionForecast(event) {
        if (event?.target?.tagName === "INPUT" && !event.target.checkValidity()) {
            event.target.reportValidity();
            return;
        }

        if (this.form && !this.form.checkValidity()) {
            this.pensionForecastElement.textContent = "Error";
            return;
        }

        this.saveState();

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

        this.pensionForecastElement.textContent = new TotalPension().calculate(memberData).toFixed(0);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => new PensionCalculatorUI());
} else {
    new PensionCalculatorUI();
}
