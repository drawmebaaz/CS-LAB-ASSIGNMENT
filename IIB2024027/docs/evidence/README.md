# Evidence to capture

Capture these screenshots from the actual app running at `http://127.0.0.1:3000`:

1. Normal behavior: input `hello`; both outputs show `hello`.
2. Vulnerable result: the harmless platform-specific payload causes `INJECTION_SUCCESS` to appear on a separate output line.
3. Protected result: the same payload is printed as literal text and the separate-marker indicator remains clear.
4. Side-by-side comparison with the comparison explanation.
5. Recent test history showing results are stored in the browser.
6. Terminal output from `npm test` with actual test results.

Do not create or submit fabricated screenshots. The browser history uses localStorage on this browser only. No database or Docker is required.
