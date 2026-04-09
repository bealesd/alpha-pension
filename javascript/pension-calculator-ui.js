import { TotalPension } from "./total-pension.js";

class PensionCalculatorUI {
    STORAGE_KEY = 'pensionCalculatorState';

    constructor() {
        this.form = document.getElementById("pension-form");

        // Added pension table
        this.tableBody = document.querySelector("#tbl tbody");
        this.rowTemplate = document.getElementById("added-pension-row");

        this.addRowButton = document.getElementById("add-added-pension-row");
        this.resetButton = document.getElementById("reset-form");

        // General pension inputs
        this.ageInput = document.getElementById("age");
        this.retirementAgeInput = document.getElementById("retirement-age");
        this.salaryInput = document.getElementById("salary");
        this.accruedInput = document.getElementById("accrued");
        this.cpiInput = document.getElementById("cpi");

        // Pension forecast
        this.pensionForecastElement = document.getElementById("pension-forecast-value");

        this.addEventListeners();

        this.loadState();

        this.form.dispatchEvent(new Event("input", { bubbles: true }));
    }

    addEventListeners() {
        document.addEventListener("input", this.updatePensionForecast.bind(this));

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
            type: row.querySelector(".type").value,
            period: row.querySelector(".period").value,
            addedPensionPayment: row.querySelector(".added-pension-payment").value
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
            if (state.salary !== undefined) this.salaryInput.value = state.salary;
            if (state.accrued !== undefined) this.accruedInput.value = state.accrued;
            if (state.cpi !== undefined) this.cpiInput.value = state.cpi;

            // Restore dynamic rows
            if (state.rows && state.rows.length > 0) {
                this.tableBody.innerHTML = ""; // Clear out any default HTML rows

                state.rows.forEach(rowData => {
                    const rowNode = this.rowTemplate.content.cloneNode(true);
                    rowNode.querySelector(".type").value = rowData.type || "";
                    rowNode.querySelector(".period").value = rowData.period || "";
                    rowNode.querySelector(".added-pension-payment").value = rowData.addedPensionPayment || "";
                    this.tableBody.appendChild(rowNode);
                });
            }
        } catch (e) {
            console.error("Failed to load pension calculator state from localStorage", e);
        }
    }

    saveState() {
        const state = {
            age: this.ageInput.value,
            retirementAge: this.retirementAgeInput.value,
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
