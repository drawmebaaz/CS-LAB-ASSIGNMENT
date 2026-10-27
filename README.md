# Web Server Security Assignment

**Course:** Cyber Security (IT-30001)  
**Institute:** Indian Institute of Information Technology Allahabad

## Ownership

| Member | Roll Number | Category | Variant |
|---|---|---|---|
| Sahil saini | IIB2024041 | SQL Injection | Authentication bypass |
| Ujwal BS | IIB2024045 | XSS | Reflected XSS |
| Sourabh Singh Rawat | IIB2024018 | CSRF | GET-based forged action |
| Bhupender | IIB2024027 | OS Command Injection | In-band command output |

## Repository Structure

- `IIB2024018/` — CSRF-style browser simulation.
- `IIB2024027/` — OS command injection application.
- `IIB2024041/` — Vulnerable and secure SQL login applications.
- `IIB2024045/` — Vulnerable and fixed reflected XSS applications.

## Requirements

- Python 3.
- Flask for the SQL injection applications.
- Node.js 20+ and npm for the command injection and CSRF demonstrations.

Run the demonstrations separately to avoid port conflicts. Commands below start from the repository root.

## SQL Injection — IIB2024041

**Root cause:** Login inputs are concatenated directly into an SQL query.

**Implemented fix:** Parameterized queries using SQLite `?` placeholders.

Install Flask:

```bash
python -m pip install flask
```

Run the vulnerable application:

```bash
cd IIB2024041/sql-login-project
python app.py
```

Open `http://127.0.0.1:5000`.

Enter `admin' -- ` as the username and any nonempty password. The injected comment bypasses the password condition.

Stop the application with `Ctrl+C`, then run the secure version:

```bash
cd ../sql-login-secure
python app.py
```

Log out or use a fresh browser session before repeating the payload. The secure version rejects it.

**Other mitigations:** Allow-list input validation, least-privilege database accounts, and safe error messages.

## Reflected XSS — IIB2024045

**Root cause:** The search input is inserted directly into the HTML response.

**Implemented fix:** `html.escape()` encodes the input before insertion into HTML body content.

Run the vulnerable version:

```bash
cd IIB2024045
python app_vulnerable.py
```

Open `http://127.0.0.1:8000` and enter:

```html
<script>alert('Reflected XSS works!')</script>
```

The vulnerable version displays an alert.

Stop it with `Ctrl+C`, then run:

```bash
python app_fixed.py
```

Repeat the same payload. It is displayed as text without executing.

**Evidence:** `IIB2024045/screenshots/`

**Other mitigations:** Framework auto-escaping, HTML sanitisation for rich content, Content Security Policy, and safe DOM sinks such as `textContent`. HttpOnly cookies limit cookie access but do not prevent XSS.

## OS Command Injection — IIB2024027

**Root cause:** The vulnerable endpoint inserts input into a shell command executed using `exec()`.

**Implemented fix:** The protected endpoint uses `execFile()` with a fixed executable, separate arguments, and `shell: false`.

```bash
cd IIB2024027
npm install
npm start
```

Open `http://127.0.0.1:3000`.

Click **Load test payload**, then **Run both demos**.

Payload:

```text
hello; echo INJECTION_SUCCESS
```

The vulnerable version executes the additional command and returns its output. The protected version prints the entire input literally.

The vulnerable endpoint restricts shell syntax to this exact demonstration payload.

**Other mitigations:** Replace commands with native APIs where possible, validate allowed arguments, and use least-privilege execution.

## CSRF — IIB2024018

```bash
cd IIB2024018
npm install
npm run dev
```

1. Open `http://localhost:3000` and create a demo account.
2. Open `http://localhost:3001` in the same browser.
3. Return to the account page to observe the deletion.

The second page embeds:

```text
http://localhost:3000/?csrf-demo=delete
```

**Root cause:** The account page processes the URL parameter and deletes its own localStorage account without verifying user intent.

**Implementation status:** This is a browser-only CSRF-style simulation. It has no authenticated server-side endpoint and no implemented CSRF mitigation or fixed version.

**Mitigation theory:** Synchronizer tokens verify request intent. SameSite cookies restrict cross-site cookie transmission. Sensitive actions can require re-authentication. State changes should avoid GET; changing to POST alone does not prevent CSRF.

## Testing Scope

Test only the group's own local applications.