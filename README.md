# Personal Portfolio — Full-Stack

A full-stack portfolio site built with **HTML/CSS/JS**, **Node.js + Express**, and **SQLite**.

## Stack
| Layer    | Tech                        |
|----------|-----------------------------|
| Frontend | HTML, CSS, Vanilla JS       |
| Backend  | Node.js, Express.js         |
| Database | SQLite (via better-sqlite3) |
| Deploy   | Vercel / Heroku / Railway   |

## Project Structure
```
portfolio/
├── public/           # Frontend (served statically)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── server/
│   └── index.js      # Express API + SQLite setup
├── package.json
├── vercel.json       # Vercel deployment config
└── .env.example
```

## API Endpoints
| Method | Path           | Description          |
|--------|---------------|----------------------|
| GET    | /api/projects | All projects         |
| GET    | /api/projects/:id | Single project   |
| POST   | /api/projects | Add project          |
| GET    | /api/skills   | All skills           |
| POST   | /api/contact  | Submit contact form  |

## Local Setup
```bash
cd portfolio
cp .env.example .env
npm install
npm run dev         # uses nodemon for hot reload
# Open http://localhost:3000
```

## Deploy to Vercel
```bash
npm install -g vercel
vercel
```

## Deploy to Heroku
```bash
heroku create your-portfolio-name
git push heroku main
```

## Swap to PostgreSQL
Replace `better-sqlite3` with `pg` and update the SQL in `server/index.js`.
