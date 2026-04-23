import { alphaAddedPensionByPeriodicalContributionFactorsForNpa } from "./alpha-added-pension-by-periodical-contribution-factors-for-npa.js";
import alphaAddedPensionRevaluationFactorByYears from "./alpha-added-pension-revaluation-factors-by-years.js";

export class AddedPension {
    calculate(memberData) {
        let totalAdded = 0;
        const stopAge = memberData.retirementAge;

        for (let currentAge = memberData.age; currentAge < memberData.retirementAge; currentAge++) {
            if (currentAge >= stopAge) continue;

            memberData.rows.forEach(row => {
                const addedPensionPaymentYearly = row.period === "month" ? row.addedPensionPayment * 12 : row.addedPensionPayment;
                const purchasedUnits = this.calculateAddedPensionForYearForGivenAge(addedPensionPaymentYearly, currentAge, row.type);
                const growthFactor = Math.pow(1 + memberData.cpi, memberData.retirementAge - currentAge);
                totalAdded += purchasedUnits * growthFactor;
            });
        }
        return totalAdded;
    }

    getAddedPensionRevaluationFactorByYears = (age, npa=68) => {
        // NPA is state pension age, which is currently set at 68
        return alphaAddedPensionRevaluationFactorByYears[npa - age].factor;
    };

    getAddedPensionByPeriodicalContributionFactorsForNpa = (age, type, npa=68) => {
        // NPA is state pension age, which is currently set at 68
        const factor = alphaAddedPensionByPeriodicalContributionFactorsForNpa[npa][age][type];
        return factor;
    };


    calculateAddedPensionForYearForGivenAge = (totalContributionsForPeriod, currentAge, type, npa = 68) => {
        return Math.round(
            totalContributionsForPeriod / (this.getAddedPensionByPeriodicalContributionFactorsForNpa(currentAge, type, npa) * this.getAddedPensionRevaluationFactorByYears(currentAge, npa))
        );
    };
}