import { care } from "./care.js";
import { added } from "./added.js";

// export function calc(d) {
//     return d.accrued + care(d) + added(d);
// }

export class Calc{ 
    calc(d) {
        return this.getTotal(d);
    }

    getTotal(d) {
        return d.accrued + care(d) + added(d);
    }
}