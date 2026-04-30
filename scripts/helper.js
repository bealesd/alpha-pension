export class Helpers {
    /**
    * Calculation date for 19/20 will be 01 April 2019.
    * 
    * Calculates age at a specific date using Temporal API
    * 
    * @param {string|Temporal} dob - Date of Birth (YYYY-MM-DD)
    * @param {string|Temporal} schemeStartDate - The calculation date (YYYY-MM-DD)
    * @returns {number} Age in full years
    */
    static getAgeAtDate(dob, schemeStartDate) {
        // Calculate the duration between the two dates, getting the total years
        return dob.until(schemeStartDate, { largestUnit: 'years' }).years;
    }

    /**
    * for 2019/2020 year
    * ageAtDate is april 1st 2019
    * calcDateStr is march 31 2020
    * 
    * Gets the scheme year dates for a given year.
    * 
    * @param {number} schemaStartYear - The starting year (e.g., 2019)
    * @returns {{ ageOfMemberATStart: Temporal, calcDateStr: Temporal }}
    */
    static getSchemeDatesForYear(schemaStartYear) {
        return {
            // 01 April of the given year
            schemeStartDate: Temporal.PlainDate.from({ year: schemaStartYear, month: 4, day: 1 }),

            // 31 March of the following year
            schemeEndDate: Temporal.PlainDate.from({ year: schemaStartYear + 1, month: 3, day: 31 })
        };
    }

    /**
    * Calculation date for 19/20 will be 31 March 2020.
    * 
    * Calculates the number of April 1sts between a calculation date 
    * and a member's 68th birthday using the Temporal API.
    * 
    * @param {Temporal} dob
    * @param {Temporal} schemeEndDate
    * @returns {number} The count of April 1sts
    */
    static getAprilFirsts(dob, schemeEndDate) {
        const age68 = dob.add({ years: 68 });

        // 1. Find the year of the first April 1st to count
        let startYear = schemeEndDate.year;
        // If the calc date is strictly AFTER April 1st, we miss this year's April 1st
        if (schemeEndDate.month > 4 || (schemeEndDate.month === 4 && schemeEndDate.day > 1)) {
            startYear++;
        }

        // 2. Find the year of the last April 1st to count
        let endYear = age68.year;
        // If the 68th birthday is strictly BEFORE April 1st, we don't count that year's April 1st
        if (age68.month < 4 || (age68.month === 4 && age68.day < 1)) {
            endYear--;
        }

        // 3. Count the years inclusive
        const count = endYear - startYear + 1;
        return count > 0 ? count : 0;
    }

    /**
    * For 19/20 statement
    * If you were born June 1980
    * Age at start of scheme will 39
    * 
    * Calculates the number of April 1sts between a calculation date 
    * and a member's 68th birthday using the Temporal API.
    * 
    * @param {Temporal} dob
    * @returns {number} Age at start of scheme
    */
    static getAgeAtSchemeStart(dob) {
        const currentYear = Helpers.getCurrentYear();;
        const schemeDates = Helpers.getSchemeDatesForYear(currentYear);

        const ageAtSchemeStart = Helpers.getAgeAtDate(dob, schemeDates.schemeStartDate);
        return ageAtSchemeStart;
    }

    /**
    * Gets the current year
    * 
    * @returns {number} Year of start of scheme
    */
    static getCurrentYear() {
        return Temporal.Now.plainDateISO().year;
    }
}
