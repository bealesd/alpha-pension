import { contributionRates } from "../../data/contribution-rates/contribution-rates.js";


export class EmployeeContributions {
    
    /**
     * Calculates the out-of-pocket cost for the employee for a given year and salary.
     * @param {number} year - The tax year (e.g. 2024 for 24/25)
     * @param {number} salary - The annualised salary
     * @returns {number} The cost in GBP
     */
    static calculateCost(year, salary) {
        contributionRates
        if (!salary || salary <= 0) return 0;

        const knownYears = Object.keys(contributionRates).map(Number).sort((a, b) => a - b);
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

        const brackets = contributionRates[effectiveYear];

        // Find the correct bracket for this salary
        const bracket = brackets.find(b => salary <= b.upTo);

        // Calculate the total cost (Rate applies to the whole salary)
        return salary * bracket.rate;
    }
}
