# 🚀 Personal Portfolio — Manigandan

A full-stack personal portfolio built with **HTML/CSS/JS**, **Node.js/Express**, and **MongoDB**.

## 📁 Project Structure

```
portfolio/
├── backend/
│   ├── server.js        ← Express API (Projects + Contact)
│   ├── package.json
│   └── .env             ← MongoDB URI (not committed)
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/main.js
├── vercel.json          ← Vercel deployment config
└── .gitignore
```

## ⚙️ Tech Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | HTML5, CSS3, Vanilla JS       |
| Backend  | Node.js, Express.js           |
| Database | MongoDB Atlas (Mongoose)      |
| Deploy   | Vercel (backend + frontend)   |

## 🛠️ Local Setup

### 1. Backend

```bash
cd backend
npm install
```

Edit `.env`:
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/portfolio
PORT=5000
```

```bash
npm run dev     # starts with nodemon on http://localhost:5000
```

### 2. Frontend

Open `frontend/index.html` directly in a browser  
*(or use VS Code Live Server extension)*

> The frontend JS points to `http://localhost:5000/api` by default.

---

## 🌐 API Endpoints

| Method | Endpoint             | Description             |
|--------|----------------------|-------------------------|
| GET    | `/api/projects`      | Get all projects        |
| POST   | `/api/projects`      | Add a new project       |
| DELETE | `/api/projects/:id`  | Delete a project        |
| POST   | `/api/contact`       | Save contact message    |

---

## 🚀 Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import repo
3. Add environment variable: `MONGO_URI` = your MongoDB Atlas connection string
4. Click **Deploy** ✅

> For the frontend on **Netlify**: drag & drop the `frontend/` folder at [netlify.com/drop](https://app.netlify.com/drop)  
> Update `API` in `frontend/js/main.js` to your Vercel backend URL.

---

## ✅ Features Checklist

- [x] Responsive dark-theme UI
- [x] Hero section with floating avatar
- [x] About section with animated counters
- [x] Skills grid with hover effects
- [x] Projects loaded dynamically from MongoDB
- [x] Add / Delete projects via UI
- [x] Contact form stored in DB
- [x] Scroll animations & navbar effects
- [x] Vercel deployment config
