# HealthRecord Reminder

A private check-up reminder calendar built with the **MERN** stack. Users enter the dates of their own appointments and follow-ups, and the app shows them back as an upcoming list and a month calendar.

**Differentiating feature: no inference.** The app displays upcoming reminders using only the title, date, time, type label and notes the user typed. It has no diagnosis, condition or medication fields, and the API never derives health conclusions or treatment suggestions from the data. "Past due" and "In 3 days" labels come from date arithmetic only.

## Features
- Register / log in (JWT, bcrypt-hashed passwords)
- Private reminders: every query is scoped to the logged-in user
- Create, edit, delete, mark done / undo
- Repeat options (monthly, 3 months, 6 months, yearly); completing a repeating reminder adds the next date
- Upcoming list with a Past due section, month calendar view, Done list
- Validation on client and server, consistent JSON error format, rate limiting, Helmet, CORS allow-list
- Responsive layout (mobile to desktop), keyboard focus styles, light/dark theme

## Tech stack
| Layer | Tech |
|-------|------|
| UI | React 18, Vite, React Router |
| API | Node.js, Express, express-validator |
| Database | MongoDB, Mongoose |
| Auth | JSON Web Tokens, bcryptjs |

## Project structure
```
healthrecord-reminder/
├── package.json            # root scripts (dev, build, start)
├── server/
│   ├── .env.example
│   └── src/
│       ├── server.js       # entry: env check, DB connect, listen
│       ├── app.js          # middleware + route mounting
│       ├── config/db.js
│       ├── models/         # User.js, Reminder.js
│       ├── routes/         # auth.js, reminders.js
│       ├── middleware/     # auth.js, validate.js, errorHandler.js
│       └── utils/          # AppError, asyncHandler, dates
└── client/
    ├── .env.example
    └── src/
        ├── api.js          # fetch wrapper + token storage
        ├── dateUtils.js
        ├── context/AuthContext.jsx
        ├── pages/          # AuthPage.jsx, Dashboard.jsx
        ├── components/     # ReminderForm, ReminderItem, CalendarView
        └── styles.css
```

## Run locally
Requires Node 18+ and MongoDB (local, or a free MongoDB Atlas cluster).

```bash
git clone <your-repo-url> && cd healthrecord-reminder
npm run install:all
cp server/.env.example server/.env     # then edit MONGO_URI and JWT_SECRET
npm run dev
```
- Client: http://localhost:5173
- API: http://localhost:5000/api/health

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## API reference
Base path `/api`. Protected routes need `Authorization: Bearer <token>`.

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | `{name, email, password}` returns `{token, user}` |
| POST | `/auth/login` | `{email, password}` returns `{token, user}` |
| GET | `/auth/me` | Current user |
| GET | `/reminders` | Query: `status=pending\|completed\|all`, `from`, `to` (YYYY-MM-DD) |
| POST | `/reminders` | `{title, date, time?, category?, repeat?, notes?}` |
| PUT | `/reminders/:id` | Update a reminder |
| PATCH | `/reminders/:id/complete` | Toggle done; adds next occurrence if repeating |
| DELETE | `/reminders/:id` | Delete |

Errors always look like `{ "success": false, "message": "...", "errors": [{ "field", "message" }] }` with status 400, 401, 404, 409, 422 or 500.



## Security notes
Passwords are hashed with bcrypt (12 rounds). Request bodies are limited to 10 KB. Auth and API routes are rate limited. The JWT is kept in `localStorage` for simplicity; for a production system, move to httpOnly cookies.
