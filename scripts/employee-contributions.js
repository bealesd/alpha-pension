// historical rates for the Alpha scheme
// Source: https://www.civilservicepensionscheme.org.uk/memberhub/joining-the-pension-scheme/contribution-rates/
// Note: Alpha applies the rate to the ENTIRE salary, not progressively like income tax.
const historicalRates = {
    // 01/04/24 - 31/03/25
    2024: [
        { upTo: 34199, rate: 0.0460 },
        { upTo: 56000, rate: 0.0545 },
        { upTo: 150000, rate: 0.0735 },
        { upTo: Infinity, rate: 0.0805 }
    ],
    // 01/04/23 - 31/03/24
    2023: [
        { upTo: 32000, rate: 0.0460 },
        { upTo: 56000, rate: 0.0545 },
        { upTo: 150000, rate: 0.0735 },
        { upTo: Infinity, rate: 0.0805 }
    ],
    // 01/04/22 - 31/03/23
    2022: [
        { upTo: 23100, rate: 0.0460 },
        { upTo: 56000, rate: 0.0545 },
        { upTo: 150000, rate: 0.0735 },
        { upTo: Infinity, rate: 0.0805 }
    ],
    // 01/04/21 - 31/03/22 (Same as 22/23 based on the website grouping)
    2021: [
        { upTo: 23100, rate: 0.0460 },
        { upTo: 56000, rate: 0.0545 },
        { upTo: 150000, rate: 0.0735 },
        { upTo: Infinity, rate: 0.0805 }
    ]
};

export class EmployeeContributions {
    
    /**
     * Calculates the out-of-pocket cost for the employee for a given year and salary.
     * @param {number} year - The tax year (e.g. 2024 for 24/25)
     * @param {number} salary - The annualised salary
     * @returns {number} The cost in GBP
     */
    static calculateCost(year, salary) {
        if (!salary || salary <= 0) return 0;

        const knownYears = Object.keys(historicalRates).map(Number).sort((a, b) => a - b);
        const minYear = knownYears[0];
        const maxYear = knownYears[knownYears.length - 1];

        let effectiveYear = year;

        // Clamp the year to the known boundaries
        if (year < minYear) {
            console.warn(`EmployeeContributions: No rates available for ${year}. Falling back to rates for ${minYear}.`);
            effectiveYear = minYear;
        } else if (year > maxYear) {
            // No warning needed for future years, just use the latest available
            effectiveYear = maxYear;
        }

        const brackets = historicalRates[effectiveYear];

        // Find the correct bracket for this salary
        const bracket = brackets.find(b => salary <= b.upTo);

        // Calculate the total cost (Rate applies to the whole salary)
        return salary * bracket.rate;
    }
}
