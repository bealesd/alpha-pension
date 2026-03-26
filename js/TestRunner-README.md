# TestRunner.js

A minimal, modern, browser-based JavaScript test runner for UI and logic tests. Designed for easy use in vanilla JS projects with ES modules.

## Features
- Write tests using `describe`, `it`, `fit`, and `expect` (Jest-like API)
- Grouping and color-coded results for pass/fail at both test and group level
- Hover on dots to see full test names
- No build step or Node.js required—runs in the browser
- Supports multiple test files and nested describes

## Quick Start

1. **Add TestRunner.js to your project**
   - Place `TestRunner.js` in your `js/` folder (or anywhere in your project).

2. **Create your test files**
   - Example: `test/unitTests.js`, `test/uiTests.js`
   - In each test file, import the singleton and use the API:

```js
import { TestRunner } from "../js/TestRunner.js";
const runner = TestRunner.getInstance();
const { it, fit, describe, expect } = runner;

describe("My Feature", () => {
  it("should work", () => {
    expect(1 + 1).toBe(2);
  });
});
```

3. **Create a test HTML file**
   - Example: `test/test.html`
   - Import the runner and your test files, then run:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My Project Tests</title>
</head>
<body>
  <script type="module">
    import { TestRunner } from "../js/TestRunner.js";
    TestRunner.runWithTestFiles([
      "./unitTests.js",
      "./uiTests.js"
    ]);
  </script>
</body>
</html>
```

4. **Open your test.html in a browser**
   - See grouped, color-coded results. Hover on dots for test names.

## API

- `describe(name, fn)` — Group related tests
- `it(name, fn)` — Define a test
- `fit(name, fn)` — Focused test (only run these if present)
- `expect(value)` — Assertion helpers:
  - `.toBe(x)`
  - `.toEqual(x)`
  - `.toBeTrue()`
  - `.toBeFalse()`
  - `.toBeGreaterThan(x)`
  - `.toBeLessThan(x)`

## Advanced
- You can have as many test files as you want—just add them to the array in `runWithTestFiles`.
- Nested `describe` blocks are supported.
- The UI is styled and injected automatically.
- No global variables are needed.

## Example Project Structure
```
project/
  js/
    TestRunner.js
    calc.js
    ...
  test/
    test.html
    unitTests.js
    uiTests.js
```

## License
MIT
