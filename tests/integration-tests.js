import { TestRunner } from "https://cdn.jsdelivr.net/gh/bealesd/js-test@ed5595d752bd49012cacd31966edd6fe3f737704/source/test-runner.js"

const runner = TestRunner.getInstance();
const { it, fit, describe, expect, spy, beforeEach, afterEach } = runner;

let iframe;
let iFrameDocument;

describe("UI Tests", () => {
    beforeEach(async () => {
        await loadHistoricSalaryIframe();
    });

    afterEach(() => {
        removeHistoricSalaryIframe();
    });

    it("Check a single 2015 salary returns expected pension for that year", async () => {
        // Arrange
        const salaryInfo = {
            year: 2015,
            salary: 24407
        }
        const expectedSalaryPensionIn2015 = '£566';

        // Act
        iFrameDocument.querySelector('#add-salary-row').click();
        const salaryInputFirstRow = iFrameDocument.querySelectorAll('#salary-table tr td input');
        const yearInput = salaryInputFirstRow[0];
        yearInput.value = salaryInfo.year;
        const salaryInput = salaryInputFirstRow[1];
        salaryInput.value = salaryInfo.salary;

        const iframeWindow = iframe.contentWindow;
        salaryInput.dispatchEvent(new iframeWindow.Event("input", {
            bubbles: true
        }));

        const salaryPension = iFrameDocument.querySelector("#breakdown-table tr > td:nth-child(5)").textContent;

        // Assert
        expect(salaryPension).toEqual(expectedSalaryPensionIn2015);
    });

    it("Check a single 2023 salary returns expected pension for that year", async () => {
        // Arrange
        const salaryInfo = {
            year: 2023,
            salary: 57131
        }
        const expectedSalaryPension = '£1,325';

        // Act
        iFrameDocument.querySelector('#add-salary-row').click();
        const salaryInputFirstRow = iFrameDocument.querySelectorAll('#salary-table tr td input');
        const yearInput = salaryInputFirstRow[0];
        yearInput.value = salaryInfo.year;
        const salaryInput = salaryInputFirstRow[1];
        salaryInput.value = salaryInfo.salary;

        const iframeWindow = iframe.contentWindow;
        salaryInput.dispatchEvent(new iframeWindow.Event("input", {
            bubbles: true
        }));

        const salaryPension = iFrameDocument.querySelector("#breakdown-table tr > td:nth-child(5)").textContent;

        // Assert
        expect(salaryPension).toEqual(expectedSalaryPension);
    });

    it("Check a single 2023 added pension returns expected pension for that year", async () => {
        // Arrange
        const addedPensionInfo = {
            year: 2023,
            amount: 1428,
            period: 'year',
            type: 'self',
            actuaryVersion: '2019-07'
        }
        const expectedAddedPension = '£150';

        // Act
        iFrameDocument.querySelector('#add-added-row').click();
        const addedPensionInputFirstRow = iFrameDocument.querySelectorAll('#added-table tr td input');

        const yearInput = addedPensionInputFirstRow[0];
        yearInput.value = addedPensionInfo.year;

        const amountInput = addedPensionInputFirstRow[1];
        amountInput.value = addedPensionInfo.amount;

        const addedPensionSelectFirstRow = iFrameDocument.querySelectorAll('#added-table tr td select');

        const actuaryInput = addedPensionSelectFirstRow[0];
        const actuaryIndex = [...actuaryInput.options].find(o => o.value === addedPensionInfo.actuaryVersion).index;
        actuaryInput.selectedIndex = actuaryIndex;

        const typeInput = addedPensionSelectFirstRow[1];
        const typeIndex = [...typeInput.options].find(o => o.value === addedPensionInfo.type).index;
        typeInput.selectedIndex = typeIndex;

        const periodInput = addedPensionSelectFirstRow[2];
        const periodIndex = [...periodInput.options].find(o => o.value === addedPensionInfo.period).index;
        periodInput.selectedIndex = periodIndex;

        const iframeWindow = iframe.contentWindow;
        amountInput.dispatchEvent(new iframeWindow.Event("input", {
            bubbles: true
        }));

        const addedPension = iFrameDocument.querySelector("#breakdown-table tr > td:nth-child(12)").textContent;

        // Assert
        expect(addedPension).toEqual(expectedAddedPension);
    });
})

async function loadHistoricSalaryIframe() {
    iframe = document.createElement("iframe");
    iframe.style = "width: 700px; height: 1000px; border: 1px solid black;";

    const iframeLoaded = waitForIframeLoad(iframe);

    const storageKey = `historic-salary-test-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    iframe.src = `../historic-salary/index.html?storageKey=${encodeURIComponent(storageKey)}`;

    document.body.appendChild(iframe);

    iFrameDocument = await iframeLoaded;

    iframe.dataset.storageKey = storageKey;
}

function removeHistoricSalaryIframe() {
    localStorage.removeItem(iframe.dataset.storageKey);
    iframe.remove();
}

function waitForIframeLoad(iframe) {
    return new Promise((resolve, reject) => {
        iframe.addEventListener("load", () => {
            resolve(iframe.contentDocument);
        }, { once: true });
    });
}


