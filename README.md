<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Supabase-Postgres-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Gemini_AI-1.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
</p>

<h1 align="center">🌍 Tripzy Lifestyle Adventures</h1>

<p align="center">
  <strong>Travel Blog & Content Platform</strong><br />
  <em>Your Gateway to Travel Inspiration</em>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-documentation">Documentation</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-project-structure">Structure</a>
</p>

---

## ✨ Features

### 🌐 Public Website

- **Travel Blog** - Rich content with images, galleries, and YouTube embeds
- **AI Trip Planner** - Gemini-powered destination recommendations
- **Search & Discovery** - Full-text search, categories, and tag filtering
- **Author Profiles** - Dedicated pages for content creators
- **Newsletter** - Subscriber management and email collection

### 🔐 Admin Panel

- **Dashboard** - Analytics and content overview
- **Post Editor** - WYSIWYG editor with AI assistance
- **Media Library** - Image and video management
- **User Management** - Role-based access (Admin, Editor, Author)
- **Site Settings** - Branding, colors, and SEO configuration

### 🤖 AI-Powered Features

- Auto-generate SEO-friendly excerpts
- Smart keyword suggestions
- Content outline generation
- Grammar and style proofreading
- Nearby attraction recommendations

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase account
- Gemini API key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/tripzydevops/tripzy-lifestyle-adventures.git
cd tripzy-lifestyle-adventures

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Run development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

---

## 📚 Documentation

| Document                                              | Description                                                       |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| [📋 Project Artifact](docs/project_artifact.md)       | Complete project documentation, architecture, and database schema |
| [🗺️ Implementation Plan](docs/implementation_plan.md) | Development roadmap with phases and task checklists               |
| [🚀 Deployment Guide](docs/deployment_guide.md)       | Step-by-step instructions for Vercel and Cloud Run deployment     |

---

## 🛠️ Tech Stack

| Layer          | Technology                               |
| -------------- | ---------------------------------------- |
| **Frontend**   | React 19, TypeScript, React Router DOM 7 |
| **Build Tool** | Vite 6                                   |
| **Styling**    | Vanilla CSS with modern design system    |
| **Icons**      | Lucide React                             |
| **Database**   | Supabase (PostgreSQL)                    |
| **Auth**       | Supabase Auth                            |
| **Storage**    | Supabase Storage                         |
| **AI**         | Google Gemini 1.5 Flash                  |

---

## 📁 Project Structure

```
tripzy-lifestyle-adventures/
├── components/
│   ├── admin/          # Admin panel components
│   └── common/         # Shared UI components
├── pages/
│   ├── admin/          # Admin pages
│   └── *.tsx           # Public pages
├── services/           # API service layer
├── hooks/              # React custom hooks
├── lib/                # Supabase client
├── data/               # Mock data
├── supabase/
│   └── migrations/     # Database schema
└── docs/               # Project documentation
```

---

## 🗄️ Database Schema

The application uses a dedicated `blog` schema in Supabase:

| Table                         | Purpose                       |
| ----------------------------- | ----------------------------- |
| `blog.posts`                  | Blog articles with SEO fields |
| `blog.categories`             | Content categories            |
| `blog.comments`               | User comments (threaded)      |
| `blog.media`                  | Image and video library       |
| `blog.youtube_videos`         | YouTube video catalog         |
| `blog.social_links`           | Social media profiles         |
| `blog.newsletter_subscribers` | Email subscribers             |

See [Database Schema Documentation](docs/project_artifact.md#-database-schema) for full details.

---

## 🧑‍💻 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy!

| Setting          | Value           |
| ---------------- | --------------- |
| Framework        | Vite            |
| Build Command    | `npm run build` |
| Output Directory | `dist`          |

---

## 🔗 Related Projects

- **[Tripzy.travel](https://tripzy.travel)** - Main travel deals platform
- **Tripzy Mobile** - React Native mobile app

---

## 📄 License

This project is proprietary software owned by Tripzy.

---

<p align="center">
  <strong>Built with ❤️ by the Tripzy Team</strong><br />
  <em>Tripzy Lifestyle Adventures - Your Gateway to Travel Inspiration</em>
</p>
