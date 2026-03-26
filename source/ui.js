import { calc } from "./calc.js";

const tbody = document.querySelector("#tbl tbody");
const tmpl = document.getElementById("row");

document.getElementById("add").onclick = () => {
    tbody.appendChild(tmpl.content.cloneNode(true));
    update();
};

document.addEventListener("input", update);

function rows() {
    return [...tbody.querySelectorAll("tr")].map(r => ({
        type: r.querySelector(".type").value,
        period: r.querySelector(".period").value,
        amount: +r.querySelector(".amt").value || 0
    }));
}

function update() {
    let d = {
        age: +age.value,
        retAge: +retAge.value,
        salary: +salary.value,
        accrued: +accrued.value,
        cpi: +cpi.value / 100,
        stopAge: useStop.checked ? +stopAge.value : null,
        rows: rows()
    };

    res.textContent = calc(d).toFixed(0);
}