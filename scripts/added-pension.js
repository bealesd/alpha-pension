import { alphaAddedPensionByPeriodicalContributionFactorsForNpa202502 } from "./alpha-added-pension-by-periodical-contribution-factors-for-npa-2025-02.js";
import { alphaAddedPensionRevaluationFactorByYears202502 } from "./alpha-added-pension-revaluation-factors-by-years-2025-02.js";

import { alphaAddedPensionByPeriodicalContributionFactorsForNpa201907 } from "./alpha-added-pension-by-periodical-contribution-factors-for-npa-2019-07.js";
import { alphaAddedPensionRevaluationFactorByYears201907 } from "./alpha-added-pension-revaluation-factors-by-years-2019-07.js";

import { Helpers } from "./helper.js";

export class AddedPension {
    calculate(memberData) {
        let totalAdded = 0;
        const stopAge = memberData.retirementAge;

        const ageAtSchemeStart = Helpers.getAgeAtSchemeStart(memberData.dob);

        // get the first scheme start year
        // this will then be incremented each year for pension calculations
        let currentSchemaStartYear = Helpers.getCurrentYear();

        for (let currentAge = ageAtSchemeStart; currentAge < memberData.retirementAge; currentAge++) {
            if (currentAge >= stopAge) continue;

            memberData.rows.forEach(row => {
                const addedPensionPaymentYearly = row.period === "month" ? row.addedPensionPayment * 12 : row.addedPensionPayment;
                const purchasedUnits = this.calculateAddedPensionForYearForGivenAge(addedPensionPaymentYearly, row.type, memberData.dob, currentSchemaStartYear++, '2025-02');
                const growthFactor = Math.pow(1 + memberData.cpi, memberData.retirementAge - currentAge);
                totalAdded += purchasedUnits * growthFactor;
            });
        }
        return totalAdded;
    }

    getAddedPensionRevaluationFactorByYears = (numberOfAprils, actuaryVersion) => {
        // number of 1st Aprils
        let factor;
        if (actuaryVersion == '2025-02')
            factor = alphaAddedPensionRevaluationFactorByYears202502[numberOfAprils].factor;
        else
            factor = alphaAddedPensionRevaluationFactorByYears201907[numberOfAprils].factor;

        console.log(`Revaluation factor: ${factor} for number of Aprils: ${numberOfAprils}`);
        return factor
    };

    getAddedPensionByPeriodicalContributionFactors = (age, type, actuaryVersion) => {
        // NPA is state pension age, which is currently set at 68
        const NPA = 68;
        let factor;
        if (actuaryVersion == '2025-02')
            factor = alphaAddedPensionByPeriodicalContributionFactorsForNpa202502[NPA][age][type];
        else
            factor = alphaAddedPensionByPeriodicalContributionFactorsForNpa201907[NPA][age][type];

        console.log(`Contribution factor: ${factor} for age: ${age}`);
        return factor;
    };


    calculateAddedPensionForYearForGivenAge = (totalContributionsForPeriod, type, dob, schemaStartYear, actuaryVersion = '2025-02') => {
        const schemeDates = Helpers.getSchemeDatesForYear(schemaStartYear);

        const currentAge = Helpers.getAgeAtDate(dob, schemeDates.schemeStartDate);
        const regularContributionFactor = this.getAddedPensionByPeriodicalContributionFactors(currentAge, type, actuaryVersion);

        const numberOfAprils = Helpers.getAprilFirsts(dob, schemeDates.schemeEndDate);
        const revaluationFactor = this.getAddedPensionRevaluationFactorByYears(numberOfAprils, actuaryVersion);

        return Math.round(totalContributionsForPeriod / (regularContributionFactor * revaluationFactor));
    };




}
