# HacXLerate — Kampus.VC

**AI-powered content creator marketplace connecting creators and brands**

HacXLerate — Kampus.VC is a production-oriented, full-stack MERN application that powers the complete creator journey from education and AI-assisted content ideation to verified collaborations, copyright protection, and reputation management.

---

## 🔄 The Complete Creator Lifecycle

1. **Learn**: Creator Academy with structured courses, quizzes, and certificates.
2. **Create**: AI Content Studio for hooks, captions, scripts, and image prompts.
3. **Discover Opportunities**: Creator & Brand Marketplace with multi-attribute filtering and search.
4. **Apply**: Transparent creator proposals and milestone breakdowns.
5. **Collaborate**: Real-time Socket.IO workspace for deliverable review and iteration.
6. **Review Content**: AI Content Guardian for brand guidelines, safety, and FTC compliance.
7. **Manage Rights**: Digital agreements, electronic signatures, and SHA-256 asset provenance.
8. **Build Reputation**: Mathematically grounded, explainable Originality & Craft Score.

---

## 🛠️ Technology Stack

- **Database**: MongoDB with Mongoose ODM (Tested with local MongoDB Service on port 27017).
- **Backend**: Node.js v22 with Express.js, TypeScript, Helmet, CORS, and Zod.
- **Frontend**: React 18, Vite 6, TypeScript 5, Tailwind CSS, Lucide Icons, and React Router 6.
- **Real-Time**: Socket.IO for authenticated 1-to-1 chat and live notifications.
- **AI Engine**: Pluggable AI Provider Adapter supporting Google Gemini with automatic, zero-mock Local Deterministic Heuristics when API keys are not supplied.
- **Testing**: Supertest, Vitest, and React Testing Library.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js `v20+` (Tested on `v22.12.0`)
- MongoDB running locally on port `27017` or MongoDB Atlas URI

### 1. Installation
Install dependencies for both workspaces from the root:

```bash
npm install
```

### 2. Environment Setup
The backend `.env` is pre-configured with development defaults:

```bash
# backend/.env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/hacxlerate
JWT_SECRET=your_jwt_secret_min_32_chars
CLIENT_URL=http://localhost:5173
```

### 3. Running Development Servers
You can run both or individual servers from the project root:

```bash
# Start backend API (http://localhost:5000)
npm run dev:backend

# Start frontend application (http://localhost:5173)
npm run dev:frontend
```

### 4. Running Test Suites

```bash
# Run backend integration tests
npm run test:backend

# Run frontend unit tests
npm run test:frontend

# Run all tests
npm test
```
