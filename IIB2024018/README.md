# Local CSRF-Style Browser Storage Demo (No Docker, No MongoDB)

This is a small React-only learning project with two local sites:

- `http://localhost:3000` — `vulnerable.com` account UI
- `http://localhost:3001` — `cat.com` cat page that automatically triggers the demo frame

Account data (username, email, and demo ID) is stored in the browser's `localStorage` for `http://localhost:3000`. Nothing is sent to a database. No passwords are collected. This project does not include Express, MongoDB, Docker, or a backend.

## Requirements

- Node.js 20+ and npm
- No Docker or database required

## Run on Windows PowerShell

1. Extract the ZIP.
2. Open PowerShell in the extracted `csrf-mern-lab` folder.
3. Run:

```powershell
npm install
npm run dev
```

4. Open `http://localhost:3000` and create a throwaway demo account.
5. Open `http://localhost:3001` in the same browser. The cat page loads a hidden iframe to the account site with a demo action query parameter.
6. Return to `http://localhost:3000` or refresh it. The account should be gone.

Keep both sites on the exact `localhost` host shown above. Do not mix `localhost` and `127.0.0.1`, because browser storage is origin-specific.

## Important security/accuracy note

Because you requested browser-only storage and no database/backend, this is a **CSRF-style client-side simulation**, not a classic server-side CSRF exploit. The cat page does not directly read or modify the account site's `localStorage` (the same-origin policy prevents that). Instead, it embeds the account site, and that site's intentionally vulnerable JavaScript handles `?csrf-demo=delete` by deleting its own browser-stored account. A real CSRF attack normally forges a request to a server-side state-changing endpoint, with the browser attaching the victim's authentication cookies. To demonstrate that exact mechanism, a backend is required, but MongoDB is not required for that—an in-memory or file-backed server could be used instead.

This is an intentionally insecure local teaching demo. Do not use it for real accounts or expose the dev servers to a network.
