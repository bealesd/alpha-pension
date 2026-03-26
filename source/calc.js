import { Care } from "./care.js";
import { added } from "./added.js";

export class Calc {
    calc(d) {
        return d.accrued + Care.care(d) + added(d);
    }
}


