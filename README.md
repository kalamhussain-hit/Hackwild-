# Mood Mirror — AI-Powered Journal & Mood Tracker

A beautiful, interactive mental wellness platform where users track their daily habits, keep personal journals, and receive empathetic AI emotional analysis and reflections. Built with Node.js, Express, MongoDB, and a modern SPA frontend.

## Features

- 🧘 **Personal Journaling** — Create personal journals/diaries with customizable mood tags, descriptions, and cover images.
- 📝 **Write Journal Entries** — Clean entry editor with word counts and drafting capabilities.
- ⚡ **AI Mood Analysis (The "Mirror")** — Empathetic, AI-powered sentiment analysis and reflection powered by Groq Llama 3.1.
- 📈 **Daily Habit Tracker** — Build consistency and track habits (e.g. meditation, gratitude, journaling) with a dynamic progress bar and metrics.
- 🔍 **Browse & Filter** — Sort and filter your entries by emotional state (mood) or search by title.
- 👤 **User Profiles** — Manage your details and track your journaling statistics.

## Quick Start

```bash
# Install dependencies
npm install

# Copy and configure environment variables
copy .env.example .env

# Start the server
npm start
```

Open **http://localhost:3000** in your browser.

## API Endpoints

### Auth
| Method | Route | Body | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | `{ name, email, password }` | Create account |
| POST | `/api/auth/login` | `{ email, password }` | Get JWT token |
| GET | `/api/auth/me` | — | Get current user |
| PUT | `/api/auth/profile` | `{ name?, bio?, avatar? }` | Update profile |

### Journals (Stories)
| Method | Route | Body | Description |
|--------|-------|------|-------------|
| GET | `/api/stories` | — | Browse journals (with mood filters) |
| GET | `/api/stories/my` | — | Get user's own journals |
| GET | `/api/stories/:id` | — | Get journal with entry list |
| POST | `/api/stories` | `{ title, description, genre, ... }` | Create journal |
| PUT | `/api/stories/:id` | any fields | Update journal |
| DELETE | `/api/stories/:id` | — | Delete journal |

### Entries (Chapters)
| Method | Route | Body | Description |
|--------|-------|------|-------------|
| GET | `/api/chapters/:id` | — | Read a journal entry |
| POST | `/api/chapters/story/:storyId` | `{ title, content }` | Add journal entry |
| PUT | `/api/chapters/:id` | any fields | Edit entry |
| DELETE | `/api/chapters/:id` | — | Delete entry |

### Habits
| Method | Route | Body | Description |
|--------|-------|------|-------------|
| GET | `/api/habits` | — | Get daily habits |
| POST | `/api/habits` | `{ name }` | Create new habit |
| PATCH | `/api/habits/:id` | `{ completed }` | Toggle habit completion |
| DELETE | `/api/habits/:id` | — | Delete habit |

### AI Analysis
| Method | Route | Body | Description |
|--------|-------|------|-------------|
| POST | `/api/ai/refine` | `{ content, instruction }` | Get AI mood reflection/analysis |

## Deploy

### Vercel
```bash
npx vercel --prod
```
Set `JWT_SECRET`, `MONGO_URI`, and `GROQ_API_KEY` as environment variables in the Vercel dashboard.
