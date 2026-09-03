import { cpiSeptember } from "../../data/inflation/cpi-september.js";

export class CpiCalculator {
    cpiLocal = {}

    /**
     * Add future CPI table indexes.
     */
    addFutureYearsToCpiData({ endYear, fallbackCpiRate = 1 }) {
        let lastYearInCpiTable = Math.max(...Object.keys(cpiSeptember));

        while (lastYearInCpiTable <= endYear) {
            lastYearInCpiTable++;
            if (!Object.hasOwn(cpiSeptember, lastYearInCpiTable)) {
                const lastCpiIndex = cpiSeptember[lastYearInCpiTable - 1] ?? this.cpiLocal[lastYearInCpiTable - 1];

                const cpiIndex = lastCpiIndex * (fallbackCpiRate / 100 + 1);
                this.cpiLocal[lastYearInCpiTable] = cpiIndex;
            }
        }
    }

    /**
    * 
    * 
    * @returns {number} Adjusted contributions
    */
    getCpiAdjustedValue({ startYear, endYear, value, fallbackCpiRate = 0 }) {
        // Example: for 25/26 statement is the latest statement
        // Contributions should not be adjusted
        if (startYear === endYear)
            return value;

        // this.addFutureYearsToCpiData({ endYear: endYear, fallbackCpiRate: fallbackCpiRate });

        // adjustment must be applied yearly
        while (startYear <= endYear) {
            const cpiForStartYear = cpiSeptember[startYear] ?? this.cpiLocal[startYear];
            const cpiForPreviousYear = cpiSeptember[startYear - 1] ?? this.cpiSeptember[startYear - 1];
            const cpiFactor = cpiForStartYear / cpiForPreviousYear;
            value = Number.isNaN(cpiFactor) ? value : value * cpiFactor;
            startYear++;
        }

        return value;
    }

    /**
    * 
    * 
    * @returns {number} Adjusted contributions
    */
    getSingleYearCpiAdjustedValue(year, value) {
        const cpiForSchemeStartYear = cpiSeptember[year] ?? this.cpiLocal[year];
        const cpiForPreviousYear = cpiSeptember[year - 1] ?? this.cpiSeptember[year - 1];
        const cpiFactor = cpiForSchemeStartYear / cpiForPreviousYear;
        value = Number.isNaN(cpiFactor) ? value : value * cpiFactor;
        return value;
    }

    /**
    * 
    * 
    * @returns {number} Adjusted contributions
    */
    getSingleYearCpi(year) {
        const cpiForSchemeStartYear = cpiSeptember[year] ?? this.cpiLocal[year];
        const cpiForPreviousYear = cpiSeptember[year - 1] ?? this.cpiSeptember[year - 1];
        if (Number.isNaN(cpiForSchemeStartYear / cpiForPreviousYear))
            return 0;

        const cpiRate = ((cpiForSchemeStartYear / cpiForPreviousYear) - 1) * 100;
        return cpiRate;
    }
}
