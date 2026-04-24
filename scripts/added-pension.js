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

    // Interpolate periodical factor for decimal ages
    getInterpolatedPeriodicalFactor(age, type, npa = 68) {
        const floorAge = Math.floor(age);
        const ceilAge = Math.ceil(age);
        
        if (floorAge === ceilAge || floorAge < 16 || ceilAge > 75) {
            return this.getAddedPensionByPeriodicalContributionFactorsForNpa(floorAge, type, npa);
        }
        
        const factorFloor = this.getAddedPensionByPeriodicalContributionFactorsForNpa(floorAge, type, npa);
        const factorCeil = this.getAddedPensionByPeriodicalContributionFactorsForNpa(ceilAge, type, npa);
        
        const fraction = age - floorAge;
        return factorFloor + (factorCeil - factorFloor) * fraction;
    }

    // Interpolate revaluation factor for decimal ages
    getInterpolatedRevaluationFactor(age, npa = 68) {
        const floorAge = Math.floor(age);
        const ceilAge = Math.ceil(age);
        
        if (floorAge === ceilAge) {
            return this.getAddedPensionRevaluationFactorByYears(floorAge, npa);
        }
        
        const factorFloor = this.getAddedPensionRevaluationFactorByYears(floorAge, npa);
        const factorCeil = this.getAddedPensionRevaluationFactorByYears(ceilAge, npa);
        
        const fraction = age - floorAge;
        return factorFloor + (factorCeil - factorFloor) * fraction;
    }

    calculateAddedPensionForYearForGivenAge = (totalContributionsForPeriod, currentAge, type, npa = 68) => {
        const periodicalFactor = this.getInterpolatedPeriodicalFactor(currentAge, type, npa);
        const revaluationFactor = this.getInterpolatedRevaluationFactor(currentAge, npa);
        
        return Math.round(
            totalContributionsForPeriod / (periodicalFactor * revaluationFactor)
        );
    };
}