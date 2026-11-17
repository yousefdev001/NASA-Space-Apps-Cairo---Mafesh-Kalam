# Web System (React + Laravel)

A full-stack web application structure featuring a **React.js (Vite)** frontend and a **Laravel** backend.

---

## 📁 Project Structure

```
├── backend/          # Laravel REST API backend
│   ├── app/
│   ├── config/
│   ├── database/
│   ├── routes/
│   │   ├── api.php   # API routes
│   │   └── web.php
│   └── ...
├── frontend/         # React.js (Vite) frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Backend (Laravel)

Navigate to the `backend` directory:

```bash
cd backend
```

Setup environment and database:

```bash
# If .env does not exist, copy from .env.example
cp .env.example .env

# Generate application key (if not already set)
php artisan key:generate

# Run migrations
php artisan migrate

# Start Laravel development server
php artisan serve
```

The backend server will run on `http://127.0.0.1:8000`.
API health check is available at `http://127.0.0.1:8000/api/health`.

---

### 2. Frontend (React.js)

Navigate to the `frontend` directory:

```bash
cd frontend
```

Install dependencies (if not already installed) and run the dev server:

```bash
npm install
npm run dev
```

The frontend server will run on `http://localhost:5173`.
