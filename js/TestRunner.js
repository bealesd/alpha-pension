// Modern test runner class for browser-based JS projects
// Usage: import { TestRunner } from './TestRunner.js';

export class TestRunner {
    static #instance;
    static getInstance(options) {
        if (!TestRunner.#instance) {
            TestRunner.#instance = new TestRunner(options);
        }
        return TestRunner.#instance;
    }

    static async runWithTestFiles(testFiles, runnerOptions) {
        const runner = TestRunner.getInstance(runnerOptions);
        await Promise.all(testFiles.map(f => import(f)));
        runner.run();
    }

    constructor({ containerId = 'test-runner-container' } = {}) {
        if (TestRunner.#instance) {
            return TestRunner.#instance;
        }
        // Create container if not present
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            document.body.prepend(container);
        }
        this.container = container;

        // Inject CSS if not already present
        if (!document.getElementById('test-runner-style')) {
            const style = document.createElement('style');
            style.id = 'test-runner-style';
            style.textContent = `
                #${containerId} {
                    font-family: system-ui;
                    background: #f5f7fb;
                    padding: 20px;
                }
                #${containerId} h1 {
                    margin-top: 0;
                }
                #${containerId} .summary {
                    margin-bottom: 20px;
                    font-weight: 600;
                }
                #${containerId} .dots {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-bottom: 20px;
                }
                #${containerId} .dot {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    cursor: pointer;
                }
                #${containerId} .dot.pass {
                    background: #10b981;
                }
                #${containerId} .dot.fail {
                    background: #ef4444;
                }
                #${containerId} .describe-section {
                    margin-bottom: 18px;
                    padding: 8px 12px 12px 12px;
                    border-radius: 8px;
                }
                #${containerId} .describe-section > h2 {
                    margin-top: 0;
                    margin-bottom: 10px;
                    font-size: 1.1em;
                    transition: color 0.2s;
                }
                #${containerId} .describe-section.pass > h2 {
                    color: #059669;
                }
                #${containerId} .describe-section.fail > h2 {
                    color: #b91c1c;
                }
                #${containerId} .test {
                    background: white;
                    padding: 10px;
                    border-radius: 6px;
                    margin-bottom: 10px;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
                }
                #${containerId} .title {
                    font-weight: 600;
                    transition: color 0.2s;
                }
                #${containerId} .title.pass {
                    color: #059669;
                }
                #${containerId} .title.fail {
                    color: #b91c1c;
                }
                #${containerId} .error {
                    display: none;
                    margin-top: 8px;
                    font-size: 13px;
                    color: #b91c1c;
                    white-space: pre-wrap;
                }
                #${containerId} .test.open .error {
                    display: block;
                }
            `;
            document.head.appendChild(style);
        }

        // Create UI elements
        this.container.innerHTML = `
            <h1>Pension Calculator Tests</h1>
            <div class="summary"></div>
            <div class="dots"></div>
            <div class="results"></div>
        `;
        this.results = this.container.querySelector('.results');
        this.dots = this.container.querySelector('.dots');
        this.summary = this.container.querySelector('.summary');

        this.total = 0;
        this.passed = 0;
        this.failed = 0;
        this.hasFocus = false;
        this.focusedTests = [];
        this.allTests = [];
        this._describeStack = [];
        this._describeSections = [];

        // Bind test functions for destructuring
        this.describe = this.describe.bind(this);
        this.it = this.it.bind(this);
        this.fit = this.fit.bind(this);
        this.expect = this.expect.bind(this);
        this.spy = this.spy.bind(this);

        TestRunner.#instance = this;
    }

    describe(name, fn) {
        // Create a section for this describe block
        const section = document.createElement('section');
        section.className = 'describe-section';
        const h = document.createElement('h2');
        h.textContent = name;
        section.appendChild(h);
        // Track nesting
        this._describeStack.push(section);
        // If this is a top-level describe, append to results immediately
        if (this._describeStack.length === 1) {
            this.results.appendChild(section);
            this._describeSections.push(section);
        } else {
            // Nested describe: append to parent section
            this._describeStack[this._describeStack.length - 2].appendChild(section);
        }
        fn();
        this._describeStack.pop();
    }

    runTest(name, fn, describeStack) {
        this.total++;
        const el = document.createElement('div');
        el.className = 'test';
        const dot = document.createElement('div');
        dot.className = 'dot';
        // Tooltip: full test name (describe + it/fit)
        let fullName = (describeStack && describeStack.length ? describeStack.join(' > ') + ' > ' : '') + name;
        dot.title = fullName;
        let passed = true;
        let titleClass = '';
        try {
            fn();
            this.passed++;
            dot.classList.add('pass');
            titleClass = 'pass';
            el.innerHTML = `<div class="title pass">✔ ${name}</div>`;
        } catch (err) {
            this.failed++;
            dot.classList.add('fail');
            titleClass = 'fail';
            el.innerHTML = `\n<div class="title fail">✖ ${name}</div>\n<div class="error">${err.message}</div>\n`;
            el.addEventListener('click', () => {
                el.classList.toggle('open');
            });
            passed = false;
        }
        this.dots.appendChild(dot);
        // Append test to current describe section if present, else to results
        if (this._describeStack.length > 0) {
            this._describeStack[this._describeStack.length - 1].appendChild(el);
            // Mark pass/fail on describe section
            let section = this._describeStack[this._describeStack.length - 1];
            if (!section._testResults) section._testResults = [];
            section._testResults.push(passed);
        } else {
            this.results.appendChild(el);
        }
    }

    it(name, fn) {
        const t = () => this.runTest(name, fn, t._describeStack);
        // Store describe context for grouping
        const describeStack = this._describeStack.map(section => section.firstChild.textContent);
        t._describeStack = describeStack;
        t._testName = name;
        this.allTests.push(t);
    }

    fit(name, fn) {
        if (!this.hasFocus) {
            this.hasFocus = true;
            this.focusedTests.length = 0;
        }
        const t = () => this.runTest(name, fn, t._describeStack);
        // Store describe context for grouping
        const describeStack = this._describeStack.map(section => section.firstChild.textContent);
        t._describeStack = describeStack;
        t._testName = name;
        this.focusedTests.push(t);
    }

    run() {
        this.results.innerHTML = '';
        this.dots.innerHTML = '';
        this.total = this.passed = this.failed = 0;
        this._describeSections = [];
        const toRun = this.hasFocus ? this.focusedTests : this.allTests;
        // Group tests by describe context
        const group = {};
        for (const t of toRun) {
            const key = t._describeStack ? t._describeStack.join('>') : '';
            if (!group[key]) group[key] = [];
            group[key].push(t);
        }
        // Track describe sections for pass/fail colouring
        const describeSectionMap = new Map();
        for (const key of Object.keys(group)) {
            let parent = this.results;
            let section = null;
            if (key) {
                const names = key.split('>');
                for (const name of names) {
                    let found = Array.from(parent.children).find(
                        el => el.className === 'describe-section' && el.firstChild.textContent === name
                    );
                    if (!found) {
                        found = document.createElement('section');
                        found.className = 'describe-section';
                        const h = document.createElement('h2');
                        h.textContent = name;
                        found.appendChild(h);
                        parent.appendChild(found);
                    }
                    section = found;
                    parent = found;
                }
            }
            for (const t of group[key]) t();
            if (section) {
                describeSectionMap.set(key, section);
            }
        }

        if (this.summary) {
            this.summary.textContent = `Total: ${this.total} | Passed: ${this.passed} | Failed: ${this.failed}`;
        }
    }

    spy(obj, methodName) {
        const original = obj[methodName];
        const calls = [];
        let impl = function (...args) { return original.apply(this, args); };
        function spyFn(...args) {
            calls.push(args);
            return impl.apply(this, args);
        }
        spyFn.calls = calls;
        spyFn.toHaveBeenCalledWith = (...expectedArgs) => {
            if (!calls.some(call => JSON.stringify(call) === JSON.stringify(expectedArgs))) {
                throw new Error(`Expected spy to have been called with ${JSON.stringify(expectedArgs)}, but was called with: ${JSON.stringify(calls)}`);
            }
        };
        spyFn.toHaveBeenCalledTimes = (n) => {
            if (calls.length !== n) {
                throw new Error(`Expected spy to have been called ${n} times, but was called ${calls.length} times`);
            }
        };
        spyFn.toHaveBeenCalled = () => {
            if (calls.length === 0) {
                throw new Error(`Expected spy to have been called at least once, but it was never called`);
            }
        };
        spyFn.toHaveBeenCalledOnce = () => {
            if (calls.length !== 1) {
                throw new Error(`Expected spy to have been called once, but was called ${calls.length} times`);
            }
        };
        spyFn.toHaveBeenCalledWithArgs = (...expectedArgs) => {
            if (!calls.some(call => JSON.stringify(call) === JSON.stringify(expectedArgs))) {
                throw new Error(`Expected spy to have been called with ${JSON.stringify(expectedArgs)}, but was called with: ${JSON.stringify(calls)}`);
            }
        };
        spyFn.original = original;
        spyFn.restore = () => { obj[methodName] = original; };
        spyFn.and = {
            callFake(fn) { impl = fn; return spyFn; },
            returnValue(val) { impl = () => val; return spyFn; },
            callThrough() { impl = function (...args) { return original.apply(this, args); }; return spyFn; },
        };
        obj[methodName] = spyFn;
        return spyFn;
    }

    expect(value) {
        const base = {
            toBe: (x) => {
                if (value !== x) throw new Error(`Expected ${value} to be ${x}`);
            },
            toEqual: (x) => {
                if (JSON.stringify(value) !== JSON.stringify(x)) throw new Error(`Expected ${JSON.stringify(value)} to equal ${JSON.stringify(x)}`);
            },
            toBeTrue: () => {
                if (value !== true) throw new Error(`Expected ${value} to be true`);
            },
            toBeFalse: () => {
                if (value !== false) throw new Error(`Expected ${value} to be false`);
            },
            toBeGreaterThan: (x) => {
                if (!(value > x)) throw new Error(`Expected ${value} to be > ${x}`);
            },
            toBeLessThan: (x) => {
                if (!(value < x)) throw new Error(`Expected ${value} to be < ${x}`);
            },
        };
        // Spy/Mock assertions
        if (typeof value === 'function' && value.calls) {
            base.toHaveBeenCalled = () => {
                if (value.calls.length === 0) throw new Error('Expected spy to have been called');
            };
            base.toHaveBeenCalledWith = (...args) => {
                if (!value.calls.some(call => JSON.stringify(call) === JSON.stringify(args))) {
                    throw new Error(`Expected spy to have been called with ${JSON.stringify(args)}`);
                }
            };
            base.toHaveBeenCalledTimes = (n) => {
                if (value.calls.length !== n) throw new Error(`Expected spy to have been called ${n} times, but was called ${value.calls.length} times`);
            };
        }
        return base;
    }
}
