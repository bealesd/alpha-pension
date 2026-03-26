export class Calculator{ 
    add(a, b) {
        return this.math(a, b, 'add');
    }

    math(a, b, operator) {
        if (operator === 'add')
            return a + b;
        throw new Error('Operation not implemented');
    }
}
