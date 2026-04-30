import { TotalPension } from "./total-pension.js";

const DOM_IDS = Object.freeze({
    form: 'pension-form',
    dob: 'dob',
    retirementAge: 'retirement-age',
    pensionStartAge: 'pension-start-age',
    salary: 'salary',
    accrued: 'accrued',
    cpi: 'cpi',
    table: 'tbl',
    rowTemplate: 'added-pension-row',
    addRowButton: 'add-added-pension-row',
    resetButton: 'reset-form',
    pensionForecastValue: 'pension-forecast-value',
    themeToggle: 'theme-toggle'
});

const DOM_CLASSES = Object.freeze({
    type: 'type',
    period: 'period',
    addedPensionPayment: 'added-pension-payment',
    removeRow: 'remove-row'
});

class PensionCalculatorUI {
    STORAGE_KEY = 'pensionCalculatorState';
    THEME_KEY = 'pensionCalculatorTheme';

    constructor() {
        this.form = document.getElementById(DOM_IDS.form);
        this.tableBody = document.querySelector(`#${DOM_IDS.table} tbody`);
        this.rowTemplate = document.getElementById(DOM_IDS.rowTemplate);
        this.addRowButton = document.getElementById(DOM_IDS.addRowButton);
        this.resetButton = document.getElementById(DOM_IDS.resetButton);
        this.themeToggle = document.getElementById(DOM_IDS.themeToggle);

        this.dobInput = document.getElementById(DOM_IDS.dob);
        this.retirementAgeInput = document.getElementById(DOM_IDS.retirementAge);
        this.pensionStartAgeInput = document.getElementById(DOM_IDS.pensionStartAge);
        this.salaryInput = document.getElementById(DOM_IDS.salary);
        this.accruedInput = document.getElementById(DOM_IDS.accrued);
        this.cpiInput = document.getElementById(DOM_IDS.cpi);

        this.pensionForecastElement = document.getElementById(DOM_IDS.pensionForecastValue);

        this.loadTheme();
        this.addEventListeners();

        this.loadState();
        this.form.dispatchEvent(new Event("input", { bubbles: true }));
    }

    addEventListeners() {
        document.addEventListener("input", this.handleInput.bind(this));
        document.addEventListener("keydown", this.handleDataStepEvent.bind(this));
        document.addEventListener("mousedown", this.handleStepperClick.bind(this));
        document.addEventListener("mouseup", this.handleStepperRelease.bind(this));
        document.addEventListener("wheel", this.handleWheel.bind(this), { passive: false });
        this.addRowButton.addEventListener("click", this.handleAddRow.bind(this));
        this.resetButton.addEventListener("click", this.handleReset.bind(this));
        this.tableBody.addEventListener("click", this.handleRemoveRow.bind(this));
        this.themeToggle.addEventListener("click", this.handleThemeToggle.bind(this));
    }

    // === Theme ===

    loadTheme() {
        const saved = localStorage.getItem(this.THEME_KEY);
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const theme = saved ?? (prefersDark ? "dark" : "light");

        document.documentElement.setAttribute("data-theme", theme);
    }

    handleThemeToggle() {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";

        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem(this.THEME_KEY, next);
    }

    // === Event Handlers ===

    handleInput(e) {
        if (e.target === this.retirementAgeInput || e.target === this.pensionStartAgeInput) {
            this.updateAgeConstraints(e.target);
        }

        this.updatePensionForecast(e);
    }

    updateAgeConstraints(target) {
        let retirementAge = +this.retirementAgeInput.value;
        let pensionStartAge = +this.pensionStartAgeInput.value;

        if (target === this.retirementAgeInput) {
            pensionStartAge = Math.max(pensionStartAge, retirementAge);
        } else if (target === this.pensionStartAgeInput) {
            retirementAge = Math.min(retirementAge, pensionStartAge);

        }

        // Final safety: retirement ≤ pensionStart
        pensionStartAge = Math.max(retirementAge, pensionStartAge);

        this.retirementAgeInput.value = retirementAge;
        this.pensionStartAgeInput.value = pensionStartAge;
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

    handleStepperClick(e) {
        if (e.target.tagName !== "INPUT" || e.target.type !== "number" || !e.target.hasAttribute("data-step")) return;
        e.target.step = e.target.getAttribute("data-step");
    }

    handleStepperRelease(e) {
        if (e.target.tagName !== "INPUT" || e.target.type !== "number" || !e.target.hasAttribute("data-step")) return;
        e.target.step = "any";
    }

    handleWheel(e) {
        const { target } = e;

        if (target.tagName !== "INPUT" || target.type !== "number" || !target.hasAttribute("data-step")) return;
        if (document.activeElement !== target) return;

        e.preventDefault();

        const step = parseFloat(target.getAttribute("data-step"));
        const current = parseFloat(target.value) || 0;
        target.value = e.deltaY < 0 ? current + step : current - step;

        target.dispatchEvent(new Event("input", { bubbles: true }));
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

            this.dobInput.value = Temporal.PlainDate.from(state.dob ?? this.dobInput.value);
            this.retirementAgeInput.value = state.retirementAge ?? this.retirementAgeInput.value;
            this.pensionStartAgeInput.value = state.pensionStartAge ?? this.pensionStartAgeInput.value;
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
        } catch (e) {
            console.error("Failed to load pension calculator state from localStorage", e);
        }
    }

    saveState() {
        const state = {
            dob: this.dobInput.value,
            retirementAge: this.retirementAgeInput.value,
            pensionStartAge: this.pensionStartAgeInput.value,
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
            dob: Temporal.PlainDate.from(this.dobInput.value),
            retirementAge: +this.retirementAgeInput.value,
            pensionStartAge: +this.pensionStartAgeInput.value,
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
