import { TestRunner } from "https://cdn.jsdelivr.net/gh/bealesd/js-test@main/source/test-runner.js"

const runner = TestRunner.getInstance();
const { it, fit, describe, expect, spy } = runner;

let iframe;
let iFrameDocument;

async function beforeEach({ showIframe }) {
    await loadHistoricSalaryIframe({ showIframe: showIframe });
}

function afterEach() {
    removeHistoricSalaryIframe();
}

describe("total-pension.js Unit Tests", () => {
    it("Check a single 2015 salary returns expected pension for that year", async () => {
        // Arrange
        await beforeEach({ showIframe: true });

        // Act
        const result = iFrameDocument.querySelector('.header h2').textContent;

        iFrameDocument.querySelector('#add-salary-row').click();
        const salaryInputFirstRow = iFrameDocument.querySelectorAll('#salary-table tr td input');
        const yearInput = salaryInputFirstRow[0];
        yearInput.value = 2015;

        const salaryInput = salaryInputFirstRow[1];
        salaryInput.value = 24407;

        const iframeWindow = iframe.contentWindow;
        salaryInput.dispatchEvent(new iframeWindow.Event("input", {
            bubbles: true
        }));

        const spIn2015 = iFrameDocument.querySelector("#breakdown-table tr > td:nth-child(5)").textContent;

        // Assert
        expect(result).toEqual('Historic Salary Pension Explorer');
        expect(spIn2015).toEqual('£566');

        afterEach();
    });
})

async function loadHistoricSalaryIframe({ showIframe }) {
    iframe = document.createElement("iframe");
    if (showIframe)
        iframe.style = "width: 700px; height: 1000px; border: 1px solid black;";
    else
        iframe.style.display = "none";

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


