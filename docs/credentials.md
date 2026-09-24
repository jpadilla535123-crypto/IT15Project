# EventSphere — Credentials & Deployment Notes

## Demo logins (seeded by `Extensions/SampleData.cs`)

All four accounts share the demo password **`EventSphere@2026`**.

| Email                    | Role     | Tabs visible in the app                             |
| ------------------------ | -------- | --------------------------------------------------- |
| `admin@eventsphere.ph`   | Admin    | All tabs                                            |
| `manager@eventsphere.ph` | Manager  | Leads, Clients, Events, Calendar, Assignments, Venues, Suppliers, Employees, Budget, Reports |
| `finance@eventsphere.ph` | Finance  | Dashboard, Budget, Billing, Reports                 |
| `staff@eventsphere.ph`   | Staff    | Dashboard, Calendar (personal, read-only workspace) |

The `staff@` account is linked to the seeded employee **Nathan Lopez**
(Operations Staff). Its full name on the header shows "Nathan Lopez · Operations
Staff", and its Dashboard/Calendar show only his data (schedule, attendance,
leave balance, payslips).

Passwords are stored **hashed** (ASP.NET `PasswordHasher`) in the `Users` table —
there is no plaintext that can be read in SSMS.

### Changing / resetting a password
Passwords should be reset through the app (the login/token flows), **not** by
editing the `PasswordHash` column directly.

## Staff portal (HR data model & endpoints)

New employee-facing tables (migration `AddStaffHR`, auto-applied on startup):

| Table            | Purpose                                              |
| ---------------- | ---------------------------------------------------- |
| `Attendance`     | One row per employee per work day (`Present/Late/Absent/Leave/RestDay`) |
| `LeaveBalances`  | Yearly leave entitlement per employee (`TotalDays`, `UsedDays`) |
| `Payslips`       | Monthly payslip per employee (days worked, daily rate = Salary÷22, gross, deductions, net) |
| `Users.EmployeeId` | FK linking a login account to an `Employee` (nullable) |

- Linking an account: set `EmployeeId` on the `Users` row (the Team Member
  modal already saves it; `POST /api/users` accepts `employeeId`).
  Without a link, the staff portal returns "No employee profile is linked…".
- Endpoints (any signed-in role, resolved by the caller's linked employee):
  - `GET /api/staff/dashboard` — profile + month stats (work days, absences,
    attendance rate, duty hours, events), upcoming schedule, events worked,
    recent attendance, leave balance, payslips.
  - `GET /api/staff/calendar?month=M&year=Y` — expanded per-day shifts and
    attendance for a month.
- Staff role permissions on the frontend are **only** `/dashboard` and
  `/calendar` (`landing-page/src/api/permissions.js`); staff never load the
  company-wide dataset (`DataProvider` short-circuits for the role).

## Local database

- Server: `localhost\SQLEXPRESS`
- Database: `EventSphereDb`
- Auth: Windows Authentication (`Trusted_Connection=True`)
- Created/seeded automatically on backend startup (EF migrations + `SampleData.Seed`).

## Frontend

- Dev URL: `http://localhost:5173`
- The Vite dev server proxies `/api` and `/uploads` to the backend
  (`http://localhost:5199` by default, override with `VITE_BACKEND_URL`).
  `VITE_API_URL` stays empty for local development.

### Using the app from a phone / tablet (same Wi-Fi)

1. Start the backend: `dotnet run` in `server/EventSphere.Server`.
2. Start the frontend: `npm run dev` in `landing-page`. Vite binds to all
   interfaces (`host: true`) and prints a **Network** URL such as
   `http://192.168.1.42:5173/`.
3. Open that Network URL on the phone. Because the API is proxied by the dev
   server, no CORS or IP configuration is needed.
4. If the Network URL does not appear, allow Node.js through the Windows
   Firewall for private networks (first run usually prompts).
5. To serve a production build on the LAN instead: `npm run build` then
   `npm run preview -- --host` and open the printed Network URL.


## Runtime configuration (all overrideable by environment variables)

| Setting                         | Env var                                     |
| ------------------------------- | ------------------------------------------- |
| Database connection string      | `ConnectionStrings__DefaultConnection`      |
| Allowed CORS origins            | `Cors__AllowedOrigins__0` (index per origin) |
| JWT signing key                 | `Jwt__Key` (use a long random 32-byte secret) |
| JWT expiry (minutes)            | `Jwt__ExpiryMinutes`                        |

`:Production` settings live in `appsettings.Production.json`; keep the
`REPLACE_WITH_...` placeholders overridden via environment variables — never
commit real secrets to the repo.

## Production deployment (MonsterASP + Cloudflare + Vercel)

Live services:

| Service | Value |
| ------- | ----- |
| API site (HTTP origin) | `http://eventsphere-backend.runasp.net` (site92718, free plan, x86 runtime) |
| HTTPS API (public URL) | `https://eventsphere-api.j-padilla-535123.workers.dev` (Cloudflare Worker proxy, see below) |
| Frontend | `https://it-15-project.vercel.app` (Vercel, SPA fallback via `vercel.json`) |
| FTP host | `site92718.siteasp.net` :21, login `site92718`, root `\wwwroot` |
| WebDeploy | `site92718.siteasp.net` :8172, Site/Login `site92718` |
| MSSQL (local, used by API) | `db69234.databaseasp.net` :1433, db/login `db69234`, SQL Server 2025 |
| MSSQL (remote, SSMS) | `db69234.public.databaseasp.net` :1433, db/login `db69234` |

### HTTPS: why the Worker is the public URL
MonsterASP's **free plan has no HTTPS** (only Premium, or a support-ticket
manual activation; free-plan Let's Encrypt certs also need manual renewal every
90 days). Browsers block HTTPS→HTTP ("mixed content"), so a free Cloudflare
Worker fronts the HTTP backend with automatic HTTPS. Worker proxy code lives in
`docs/cloudflare-worker.js` (paste into Workers → eventsphere-api → Edit code →
Deploy). The frontend's `VITE_API_URL` and any webhook callbacks must use the
Worker URL, never the raw HTTP origin.

### How a deploy works
Pushing backend changes to `main` triggers
`.github/workflows/deploy-monsterasp.yml`:
publish `.NET 10` (framework-dependent) → inject real `appsettings.Production.json`
(from GitHub Secrets) → force `ASPNETCORE_ENVIRONMENT=Production` in `web.config`
→ put the site offline with a plain `curl -T app_offline.htm` to
`/wwwroot/app_offline.htm` (that exact path is what IIS watches) → FTP-deploy
the publish folder → remove `app_offline.htm` via FTP `DELE` → smoke test
`/api/events/public`.
`dangerous-clean-slate` is **off**, so `wwwroot/wwwroot/uploads/**` (payment
evidence) survives every deploy.

> History: an earlier version used a YAML list under a `with:` input
> (`exclude:`), which GitHub's workflow parser rejects ("A sequence was not
> expected") and produced 0-job failed runs — keep such values as plain
> strings. The offline toggle also previously targeted the wrong folder; the
> served site root is `/wwwroot/` (SFTPGo), verified by
> `CWD /wwwroot` + `DELE app_offline.htm`.

### GitHub Secrets required (repo → Settings → Secrets and variables → Actions)
| Secret | Value (never commit/paste publicly) |
| ------ | ----------------------------------- |
| `FTP_HOST` | `site92718.siteasp.net` |
| `FTP_LOGIN` | `site92718` |
| `FTP_PASSWORD` | FTP password from panel |
| `PROD_DB_CONNECTION` | Local access connection string: `Server=db69234.databaseasp.net;Database=db69234;User Id=db69234;Password=...;Encrypt=False;MultipleActiveResultSets=True` |
| `PROD_CORS_ORIGIN` | Real frontend origin: `https://it-15-project.vercel.app` |
| `PROD_JWT_KEY` | Long random 32-byte secret (e.g. `openssl rand -base64 48`) |
| `PROD_PAYMONGO_SECRET` | (optional) PayMongo secret key |
| `PROD_SMTP_HOST` | SMTP server for auto-reply emails (e.g. `smtp.gmail.com`) |
| `PROD_SMTP_PORT` | SMTP port (default `587`) |
| `PROD_SMTP_USER` | SMTP login (full email address) |
| `PROD_SMTP_PASSWORD` | SMTP password / Gmail **App Password** (2FA accounts need an app password, not the main password) |
| `PROD_SMTP_FROM` | "From" address that recipients see (use the SMTP account's own address to avoid SPF rejection) |

> Until the `PROD_SMTP_*` secrets are set, production has `Smtp.Host` empty so
> `IsConfigured` is false: request submissions and newsletter signups still work,
> the auto-reply and ticket-confirmation emails are simply skipped, and the
> dashboard "Message" action falls back to opening the staff member's mail app.

### Vercel (frontend)
1. Import the repo; set **Root Directory** to `landing-page`.
2. Framework preset `Vite`, build `npm run build`, output `dist`.
3. Add environment variable **`VITE_API_URL=https://eventsphere-api.j-padilla-535123.workers.dev`**
   (the HTTPS Worker URL — never the raw HTTP origin, or browser mixed-content will block it).
4. `landing-page/vercel.json` handles the SPA fallback to `index.html`. The API is
   reached cross-origin through the Worker — no Vercel `/api` rewrites.
5. Production site: `https://it-15-project.vercel.app`.

### First deploy checklist
1. Backend: add the GitHub Secrets above (use the connection string from the **Local access** box).
2. `git push origin main` → check the **Deploy API to MonsterASP** run is green.
3. Cloudflare: Worker `eventsphere-api` with the code in `docs/cloudflare-worker.js`.
4. Visit `https://eventsphere-api.j-padilla-535123.workers.dev/api/events/public` → expect HTTP 200.
5. Vercel: deploy `landing-page` with `VITE_API_URL` = the Worker URL.
6. Log in with the demo accounts below (admin sees Leads/Events etc.).
7. Out of the box, the "Get A Ticket" feed shows the seeded **Public** event
   ("Heritage Bank Customer Appreciation"); create more events with
   AccessType = **Public** to let visitors register for them.