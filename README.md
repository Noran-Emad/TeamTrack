# TeamTrack

TeamTrack is a React app for teachers to organize students, teamwork groups, classroom activities, and assessments across six teamwork skills. It includes a dashboard with responsive charts, student profiles, learning strategies, activity and group management, account roles, and CSV reports. Vite builds the React interface; the Node.js server provides the API and serves the production build.

## Run TeamTrack locally

### 1. Install Node.js

Install Node.js version 18 or newer.

### 2. Start the app

Open PowerShell in the TeamTrack project folder and install the dependencies:

```powershell
npm install
```

For local development, run:

```powershell
npm run dev
```

Open **http://localhost:5173** in your browser. This starts the Vite React app and the Node API together. Keep the terminal open while you use TeamTrack. Press **Ctrl+C** to stop both processes.

If you have already created a local account, choose **Sign in** and use that account. For a fresh local setup, create the first administrator before registering:

```powershell
$env:TEAMTRACK_ADMIN_KEY = "choose-a-long-private-setup-key"
npm run dev
```

On the site, choose **Create an account** and enter the same value in **Admin setup key**. The first account becomes the administrator. Keep the key private. After an administrator exists, new accounts are teachers by default. The setup key is not your sign-in password.

### 3. Use the app

1. **Students:** Add students with their name, ID, grade, and group. Select a student's name to open their profile.
2. **Groups:** Create groups and assign students to them.
3. **Learning Strategies:** Browse the built-in strategies or create a custom one.
4. **Activities:** Create an activity, choose a strategy and group, set its date and instructions, and mark it completed when finished.
5. **Assessments:** Open Assessments or use the assessment button beside a student. Choose Initial, Ongoing, or Final, rate the six skills from 1 to 5, and save observations.
6. **Reports:** Compare initial and latest scores. Use **Export CSV** to download assessment records.

Local accounts and classroom records are stored in `data/teamtrack.json`. This file stays on this computer and is excluded from Git. Local data does not automatically transfer to a hosted site.

To preview a production build locally, run `npm start` and open **http://localhost:3000**. This builds the React app into `dist/`, then starts the Node server.

## Deploy online for free (Render + Supabase)

The hosted app uses Supabase for persistent accounts and classroom data. Render runs the website and backend. The hosted version has its own accounts and data; a local account is not copied over automatically.

### A. Create and prepare the Supabase project

1. Create a Supabase project.
2. In the Supabase dashboard, choose **SQL Editor → New query**.
3. Open `database/supabase-schema.sql`, copy all of its contents into the query, and click **Run**. This creates the tables TeamTrack needs.
4. Find the **Project URL** from the project's **Connect** dialog or **Integrations → Data API**. It looks like `https://your-project-id.supabase.co`.
5. In **Project Settings → API Keys**, copy or create a **Secret key**. This key must only be used by the backend. Never add it to browser code, GitHub, or a message.

### B. Put the project on GitHub

1. Create a **private** GitHub repository.
2. Upload the project folders and files: `public/`, `server/`, `database/`, `package.json`, `README.md`, and `.gitignore`.
3. Do not upload `.env` files, passwords, API keys, or the local `data/` folder. `.gitignore` excludes local data automatically.

### C. Create the Render service

1. In Render, choose **New → Web Service** and connect the private GitHub repository.
2. Select the **Free** instance and set:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
3. In the service's **Environment** settings, add these variables:

   | Variable | Value |
   | --- | --- |
   | `SUPABASE_URL` | Your Supabase Project URL |
   | `SUPABASE_SECRET_KEY` | Your Supabase Secret key |
   | `TEAMTRACK_SESSION_SECRET` | A long random value; keep it private |
   | `TEAMTRACK_ADMIN_KEY` | A different long random value; keep it private |
   | `NODE_ENV` | `production` |

   Generate a random value in PowerShell by running this command. Run it twice to get separate values for the session secret and admin setup key:

   ```powershell
   [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()
   ```

4. Save the environment settings and deploy. When Render finishes, open the `onrender.com` address shown for the service.
5. On the hosted site, choose **Create an account** and enter the `TEAMTRACK_ADMIN_KEY` value. That creates the first hosted administrator. Save the admin email and password; those are used to sign in. You only need the setup key when establishing an admin while no admin account exists.

### D. Add teachers

Share the hosted website address with your teachers. Each teacher selects **Create an account**, registers with their own name, email, and password, then signs in. Their role is **teacher** by default. An administrator can use **Admin** in the sidebar to view accounts and promote a trusted teacher to admin.

All accounts on this version use one shared classroom workspace. Teachers can see and manage the same student roster, groups, activities, and assessment data. Registration is open to anyone who has the address; invite-only registration is not implemented.

## Free hosting notes

Free hosting has limits and can change. Render may put a free service to sleep when unused, so the first visit after inactivity can be slow. Supabase may pause a free project after a period of low activity. Check the providers' current terms and back up important records from Supabase. Test the deployed app with sample data before relying on it for classroom records.

## Backend API routes

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/state`, `PUT /api/state`
- `GET /api/admin/users`, `PATCH /api/admin/users`
- `GET /api/health`

## Folder layout

```text
index.html              Vite entry point
src/                    React application and styles
  App.jsx               React pages, charts, dialogs, and workflows
  main.jsx              React application entry point
  styles.css            Application styles
server/                 Node.js backend and API
database/               Supabase SQL schema
data/                   Local-only JSON data (excluded from Git)
dist/                   Generated production bundle (excluded from Git)
vite.config.js           Vite configuration and local API proxy
package.json            Start command and Node version
README.md               Local usage and deployment guide
```
