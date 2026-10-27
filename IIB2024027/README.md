# Command Injection Security Lab (No Docker, No Database)

A local educational web application for **OS Command Injection — Variant 1: In-band command output returned**. It demonstrates a deliberately vulnerable endpoint and a protected endpoint using Node.js `execFile()` with an argument array.

## Important architecture notes

- **No Docker is required.** The app runs directly on your computer with Node.js.
- **No database is used.** The browser saves the selected demo input and the last 10 test results with `localStorage`.
- A small **Node.js + Express backend is required** because JavaScript running only in a browser cannot execute operating-system commands. The server binds strictly to `127.0.0.1`.
- The vulnerable endpoint accepts only `hello` or a fixed harmless demonstration payload. Do not remove this allow-list, add arbitrary command entry, forward this app to other devices, or deploy it publicly.

## Requirements

- Node.js 20 or newer (Node.js 22 recommended)
- npm
- A current browser such as Chrome, Edge, or Firefox

## Run locally on Windows

Open PowerShell or the VS Code terminal in the project folder and run:

```powershell
npm install
npm start
```

Open `http://127.0.0.1:3000` in your browser. Keep the terminal open while using the site.

If port 3000 is already in use, you can choose a different port in PowerShell:

```powershell
$env:PORT=3001
npm start
```

Then open `http://127.0.0.1:3001`.

## Run locally on Linux/macOS

```bash
npm install
npm start
```

Open `http://127.0.0.1:3000`.

## Demonstration steps

1. Open the website and check that the status says it is connected to the local lab.
2. Click **Use normal input** and then **Compare both**. Both outputs should show `hello`.
3. Click **Load harmless payload**. The application automatically chooses the shell separator for your operating system:
   - Windows: `hello & echo INJECTION_SUCCESS`
   - Linux/macOS: `hello; echo INJECTION_SUCCESS`
4. Click **Run vulnerable test**. The response should show `INJECTION_SUCCESS` as a separate output line, demonstrating in-band command injection.
5. Click **Run protected test** with the same payload. The payload should be returned as literal text, not run as a second command.
6. Click **Compare both** and capture screenshots of the results.
7. Scroll to **Recent test history**. Results are kept in this browser's localStorage. Use **Clear local history** to delete that history from this browser.

## API endpoints

- `GET /api/health` — checks that the local server is running.
- `GET /api/config` — returns the platform-specific fixed demo payload.
- `POST /api/vulnerable` — runs the intentionally vulnerable demonstration.
- `POST /api/protected` — runs the protected demonstration.

Both POST endpoints accept JSON like `{ "input": "hello" }`, or the exact platform-specific harmless payload returned by `/api/config`. All other inputs are rejected by server-side allow-list validation.

## How the vulnerability works

The vulnerable endpoint constructs a shell command using `exec(`echo ${input}`)`. Since `exec()` invokes a shell, and the input is concatenated into a command string, the shell interprets the separator in the approved demonstration payload and runs a second `echo` command. The second command's output is returned in the HTTP response. That visible response is why this is **in-band** command injection.

The separator differs by platform: Windows `cmd.exe` uses `&`, while POSIX shells use `;`.

## Implemented mitigation

The protected endpoint calls `execFile(process.execPath, [helperPath, input], { shell: false })`. The executable and argument are passed separately, so the shell does not interpret the separator. A tiny helper script prints the input literally. On Windows, `echo` is a shell built-in rather than a normal executable, so the helper makes the demonstration consistent across platforms.

`execFile()` does not make every possible process invocation automatically safe. Keep a trusted executable, server-side validation, a timeout, output limits, safe error handling, and least privilege.

## Other mitigations to explain in the viva

1. **Avoid the shell:** Prefer a library or OS API that performs the required action without interpreting shell command text.
2. **Argument-vector execution:** Pass the executable and arguments separately rather than concatenating them into a string.
3. **Allow-list validation:** Accept only inputs that are valid for the expected task. The demo restricts inputs to two fixed harmless values.
4. **Least privilege:** Run a web process with only the operating-system permissions it needs.

## Browser localStorage

The app stores the selected input and up to 10 recent test result summaries in `localStorage` in the current browser profile. This is not a database and does not sync to another computer. Clearing browser site data or clicking **Clear local history** removes the saved history. Actual command execution happens in the local Node.js server; browser storage only keeps convenience data and result summaries.

## Automated tests

Install dependencies and run:

```bash
npm test
```

Tests cover the health endpoint, platform-specific configuration, normal input, the fixed harmless exploit payload, the protected behavior, and rejection of unapproved input. Tests execute the harmless commands locally. Run them only in this project directory on your own computer.

## Likely viva questions

**1. What is OS command injection?**  
It happens when user-controlled input changes an operating-system command so that an unintended command executes.

**2. What is in-band command injection?**  
The output of the injected command is returned through the same request/response channel, here the browser's HTTP response.

**3. Why does the vulnerable endpoint run the extra command?**  
It concatenates input into a string passed to `exec()`, so the shell interprets the separator as command syntax.

**4. What is a shell?**  
A program that interprets command text and shell operators, then launches commands.

**5. What does `exec()` do?**  
It runs a command string through a shell and captures output.

**6. What does `execFile()` do?**  
It starts a particular executable and passes arguments separately. With `shell: false`, shell metacharacters inside an argument are not interpreted by a shell.

**7. What is an argument vector?**  
A list of arguments passed separately to a program, rather than combined into shell command text.

**8. Why does the marker still appear in the protected output?**  
It is part of the supplied text. It does not appear as a separate output line from an additional command.

**9. Why validate input if we use `execFile()`?**  
Validation ensures inputs match the application's requirements and reduces unexpected behavior. It is defense in depth.

**10. What is least privilege?**  
Run the app under an account with only the permissions required for its job.

**11. Why is there a backend if we use localStorage?**  
A browser cannot directly execute OS commands. The local Node.js server performs the demo; localStorage only saves UI preferences and recent results.

**12. Where are the results stored?**  
The last 10 test summaries are stored in the current browser's localStorage, not in a server database.

## 2–3 minute video script

“Hello, my project demonstrates OS command injection, Variant 1, called in-band command injection. In-band means the additional command's output is returned through the same HTTP response. I built a local Node.js and Express website with a vulnerable endpoint and a protected endpoint. The project does not use Docker or a database; the browser keeps a small recent-result history in localStorage.

First, I test normal input, `hello`, against both endpoints. Next, I load the harmless platform-specific demonstration payload. In the vulnerable endpoint, the input is concatenated into a shell command using `exec()`. The shell interprets the command separator and executes another harmless echo command. The marker appears on its own output line, which demonstrates the vulnerability.

Now I run the same input against the protected endpoint. It uses `execFile()` with a separate argument array and no shell. The payload is printed as literal text, so the additional command does not execute.

The root cause is unsafe concatenation of user input into a shell command. The mitigation I implemented is argument-vector execution without a shell. Other defenses include allow-list validation and least privilege. The server is bound to localhost only and should not be exposed to a network.”

## Evidence checklist

See [`docs/evidence/README.md`](docs/evidence/README.md) for the screenshots to capture. Capture genuine output from your own running application; do not submit fabricated evidence.

## Ownership declaration

Complete [`OWNERSHIP.md`](OWNERSHIP.md) with actual group member names and roll numbers before submitting.
