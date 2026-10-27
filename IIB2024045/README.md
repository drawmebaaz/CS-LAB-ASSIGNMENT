# Reflected XSS Demonstration

## Ownership

| Member    | Roll number |          Category          |    Variant    |
|           |             |                            |               |
| Ujwal B S | IIB2024045  | Cross-Site Scripting (XSS) | Reflected XSS |

## Requirements

Python 3. No additional packages are needed.

## Run

Vulnerable version:
```powershell
py app_vulnerable.py
```

Fixed version:
```powershell
py app_fixed.py
```

Run one version at a time. Stop it with Ctrl+C before switching.

Open http://127.0.0.1:8000 in your browser.

## Exploit

Enter this into the search box:
```html
<script>alert('Reflected XSS works!')</script>
```

The vulnerable version executes the script and shows a popup.
Copying the resulting URL into a new tab also triggers it.

## Root Cause

The server inserts the request's search input directly into the
HTML response without output encoding. The browser interprets
the injected script as code.

## Implemented Mitigation

The fixed version uses Python's html.escape() before inserting
the input into HTML body content:

```python
page = PAGE.replace("SEARCH_RESULT", escape(query))
```

The same payload is displayed as text without executing.

## Other Mitigations

Framework auto-escaping automatically encodes template values.
A trusted HTML sanitiser removes unsafe content when rich HTML
must be supported. Content Security Policy restricts script
execution as an additional defence. HttpOnly cookies prevent
JavaScript from reading those cookies, but do not prevent XSS.
Safe DOM sinks such as textContent display plain text without
interpreting it as HTML.

## Evidence

- screenshots/before-fix.png — payload executes.
- screenshots/after-fix.png — same payload displays as text.

Testing is limited to our own local application.