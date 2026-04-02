import { TotalPension } from "./total-pension.js";

class PensionCalculatorUI {
    constructor() {
        this.tableBody = document.querySelector("#tbl tbody");
        this.rowTemplate = document.getElementById("row");
        this.addRowButton = document.getElementById("add");
        this.ageInput = document.getElementById("age");
        this.retAgeInput = document.getElementById("retAge");
        this.salaryInput = document.getElementById("salary");
        this.accruedInput = document.getElementById("accrued");
        this.cpiInput = document.getElementById("cpi");
        this.useStopCheckbox = document.getElementById("useStop");
        this.stopAgeInput = document.getElementById("stopAge");
        this.resultElement = document.getElementById("res");

        document.addEventListener("input", () => this.update());

        this.addRowButton.onclick = () => {
            this.tableBody.appendChild(this.rowTemplate.content.cloneNode(true));
            this.update();
        };

        // Calculate once on load using default values
        this.update();
    }

    getRows() {
        return [...this.tableBody.querySelectorAll("tr")].map(row => ({
            type: row.querySelector(".type").value,
            period: row.querySelector(".period").value,
            amount: +row.querySelector(".amt").value || 0
        }));
    }

    update() {
        const memberData = {
            age: +this.ageInput.value,
            retAge: +this.retAgeInput.value,
            salary: +this.salaryInput.value,
            accrued: +this.accruedInput.value,
            cpi: +this.cpiInput.value / 100,
            stopAge: this.useStopCheckbox.checked ? +this.stopAgeInput.value : null,
            rows: this.getRows()
        };
        this.resultElement.textContent = TotalPension.calculate(memberData).toFixed(0);
    }
}

// Instantiate the UI class when DOM is ready
if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => new PensionCalculatorUI());
else
    new PensionCalculatorUI();
