<div align="center">

![SecTracker Banner](https://i.ibb.co/LhXb1DFy/shot-style-2025-06-12-T14-34-26-093-Z.png)

A Modern Bug Bounty and Security Research Management Platform

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.io/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)

</div>

## 📋 Table of Contents
- [Overview](#-overview)
- [Features](#-features)
- [What's New](#-whats-new)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration-options)
- [Development](#-development)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Overview
SecTracker is your all-in-one platform for managing bug bounty hunting and security research activities. Track your findings, manage reports, and organize your security research workflow efficiently. Built with a sleek hacker-aesthetic UI for those late-night hunting sessions.

## ✨ Features

### 🎯 Platform & Program Management
- Organize bug bounty platforms (HackerOne, Bugcrowd, Intigriti, etc.)
- Track scope, bounty ranges, and program details
- Manage platform-specific profiles

### � Bug Report Management
- Detailed bug reporting with full markdown support
- Status tracking: Draft → Submitted → Triaged → Resolved
- Severity and impact assessment (Critical, High, Medium, Low, Info)
- **NEW:** Collaborator tracking with percentage splits

### 📊 Dashboard
- Visual overview of your hunting activities
- **NEW:** Accurate "My Targets" count showing programs, not platforms
- Drag-and-drop card customization
- Progress tracking and bounty statistics

### 📚 Research Tools
- Integrated RSS feed reader for security news
- Reading list management
- Personal notes and tips organization

### ✅ Security Checklists
- **NEW:** Comprehensive built-in checklist library covering:
  - 🔓 IDOR Testing
  - 💉 XSS (Reflected, Stored, DOM-based)
  - 🎯 Open Redirects
  - 🧠 Business Logic Flaws
  - 🐍 SSRF
  - 🔐 Authentication & Session Issues
  - 🧾 OAuth & SAML
  - 🌀 CORS Misconfigurations
  - 🔨 File Upload Vulnerabilities
  - ⚙️ Injection Attacks
  - ⚡ GraphQL & API Exploits
  - � Sensitive Info Disclosure
  - ...and more!
- Create custom checklists for your methodology
- Markdown support in checklist items

### 🎨 Hacker Theme
- "Matrix-style" dark mode optimized for focus
- Monospace fonts and green accents
- Toggle between hacker and standard themes

## 🆕 What's New

### Latest Updates
- **Collaborator Support**: Track who you worked with on a bug and split percentages
- **Improved Dashboard**: "My Targets" now correctly shows program count
- **Cleaned Up Codebase**: Removed hardcoded mock data, all data now stored in database
- **Environment-based Secrets**: Supabase keys moved to `.env` for security
- **Massive Checklist Library**: 16 categories with 50+ security test cases

## 🛠️ Tech Stack

### Frontend
- **React + TypeScript** - Modern UI development
- **Vite** - Blazing fast builds
- **Shadcn UI** - Beautiful, accessible components
- **TanStack Query** - Efficient state management
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Robust relational database
- **Row Level Security** - Secure data access
- **Real-time** - Live updates

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun package manager
- A Supabase project (free tier works great)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Black1hp/sectracker.git
cd sectracker
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**

Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Initialize the database:**

Run the SQL scripts in `database/scheme.sql` in your Supabase SQL editor to create all necessary tables and RLS policies.

5. **Start the development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### 🐳 Docker Setup
```bash
docker-compose up --build
```

## 🔧 Configuration Options

### Supabase Setup (Recommended)
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your Project URL and anon/public key
4. Add them to your `.env` file
5. Run `database/scheme.sql` in the SQL editor

### Local PostgreSQL Setup
For local development without Supabase:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/sectracker
```

## 📖 Development

### Project Structure
```
sectracker/
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts (Theme, Auth)
│   ├── hooks/          # Custom React hooks
│   ├── integrations/   # Supabase client
│   ├── lib/            # Utilities
│   ├── pages/          # Page components
│   └── types/          # TypeScript types
├── database/
│   └── scheme.sql      # Database schema
└── public/             # Static assets
```

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🤝 Contributing
Contributions are welcome! If you have ideas for new checklists, features, or improvements:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## � License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments
- [Shadcn UI](https://ui.shadcn.com/) for the beautiful component library
- [Supabase](https://supabase.com/) for the amazing backend platform
- [Lucide](https://lucide.dev/) for the icon set
- The bug bounty community for inspiration

---

<div align="center">

**Happy Hunting! 🕵️‍♂️**

*Built with ❤️ by security researchers, for security researchers*

</div>
