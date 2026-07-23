# Top Repos 🚀

A modern Next.js dashboard for exploring GitHub Trending repositories with automated AI translations to Hebrew and custom repository lists management.

---

## ⚡ Installation & Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd top_repos
```

### 2. Environment Setup
Copy the example environment file and configure variables:
```bash
cp .env.example .env
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup
Ensure PostgreSQL is running, then apply database migrations:
```bash
npx prisma db push
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Running with Docker

Run the application and PostgreSQL database with Docker Compose:

```bash
docker-compose up -d
```

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database & ORM:** PostgreSQL + Prisma ORM
- **Styling:** Tailwind CSS + Lucide Icons
- **AI Translation:** OpenRouter API (Gemini / Claude / GPT)

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start development server |
| `npm run build` | Build application for production |
| `npm run start` | Start production server |
| `npm run lint` | Run Next.js linter |
