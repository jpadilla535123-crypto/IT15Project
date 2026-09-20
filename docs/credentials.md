# EventSphere — Credentials & Deployment Notes

## Demo logins (seeded by `Extensions/SampleData.cs`)

All four accounts share the demo password **`EventSphere@2026`**.

| Email                    | Role     | Tabs visible in the app                             |
| ------------------------ | -------- | --------------------------------------------------- |
| `admin@eventsphere.ph`   | Admin    | All tabs                                            |
| `manager@eventsphere.ph` | Manager  | Leads, Clients, Events, Calendar, Assignments, Venues, Suppliers, Employees, Budget, Reports |
| `finance@eventsphere.ph` | Finance  | Dashboard, Budget, Billing, Reports                 |
| `staff@eventsphere.ph`   | Staff    | Dashboard, Events, Calendar, Assignments            |

Passwords are stored **hashed** (ASP.NET `PasswordHasher`) in the `Users` table —
there is no plaintext that can be read in SSMS.

### Changing / resetting a password
Passwords should be reset through the app (the login/token flows), **not** by
editing the `PasswordHash` column directly.

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

## Production deployment (MonsterASP + Vercel)

Live services:

| Service | Value |
| ------- | ----- |
| API site | `https://eventsphere-backend.runasp.net` (site92718, free plan, x86 runtime) |
| FTP host | `site92718.siteasp.net` :21, login `site92718`, root `\wwwroot` |
| WebDeploy | `site92718.siteasp.net` :8172, Site/Login `site92718` |
| MSSQL (local, used by API) | `db69234.databaseasp.net` :1433, db/login `db69234`, SQL Server 2025 |
| MSSQL (remote, SSMS) | `db69234.public.databaseasp.net` :1433, db/login `db69234` |

### How a deploy works
Pushing backend changes to `main` triggers
`.github/workflows/deploy-monsterasp.yml`:
publish `.NET 10` (framework-dependent) → inject real `appsettings.Production.json`
(from GitHub Secrets) → force `ASPNETCORE_ENVIRONMENT=Production` in `web.config`
→ FTP-deploy while the site is offline via `app_offline.htm` → bring it online →
smoke test `/api/events/public`.
`dangerous-clean-slate` is **off**, so `wwwroot/wwwroot/uploads/**` (payment
evidence) survives every deploy.

### GitHub Secrets required (repo → Settings → Secrets and variables → Actions)
| Secret | Value (never commit/paste publicly) |
| ------ | ----------------------------------- |
| `FTP_HOST` | `site92718.siteasp.net` |
| `FTP_LOGIN` | `site92718` |
| `FTP_PASSWORD` | FTP password from panel |
| `PROD_DB_CONNECTION` | Local access connection string: `Server=db69234.databaseasp.net;Database=db69234;User Id=db69234;Password=...;Encrypt=False;MultipleActiveResultSets=True` |
| `PROD_CORS_ORIGIN` | Vercel frontend origin, e.g. `https://eventsphere.vercel.app` |
| `PROD_JWT_KEY` | Long random 32-byte secret (e.g. `openssl rand -base64 48`) |
| `PROD_PAYMONGO_SECRET` | (optional) PayMongo secret key |

### Vercel (frontend)
1. Import the repo `landing-page/` folder (root may be the repo root; select the
   `landing-page` directory).
2. Framework preset `Vite`, build `npm run build`, output `.next` → **Vite uses
   `dist`** (`npm run build`), so set output directory `dist`.
3. Add environment variable **`VITE_API_URL=https://eventsphere-backend.runasp.net`**.
4. Commit `landing-page/vercel.json` (SPA fallback to `index.html`). The API is
   reached cross-origin directly — no Vercel `/api` rewrites (avoids body-size cap
   on the 4.5 MB upload rewrite limit).

### First deploy checklist
1. Enable **HTTPS** (Let's Encrypt) on `eventsphere-backend.runasp.net` + HTTPS redirect.
2. Add the GitHub Secrets above (use the connection string from the **Local access** box).
3. `git push origin main` for backend; check the **Deploy API to MonsterASP** run.
4. Visit `https://eventsphere-backend.runasp.net/api/events/public` → expect HTTP 200 `[]` or event list.
5. Deploy the Vercel project, then log in with the demo accounts below.