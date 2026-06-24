# InkWell — Creative Writing Platform

A Wattpad-style platform where authors publish stories and readers engage with comments, likes, and follows. Built with Node.js, Express, MongoDB, and a beautiful dark-themed SPA frontend.

## Features

- 📖 **Publish Stories** — Create stories with titles, descriptions, genres, tags, and cover images
- ✍️ **Write Chapters** — Chapter editor with word count, save as draft or publish
- 🔍 **Browse & Discover** — Filter by genre, search by title, sort by trending/recent
- 📚 **Reading List** — Save stories to your personal reading list
- 💬 **Comments** — Comment on chapters with threaded replies
- ❤️ **Likes** — Like stories and comments
- 👥 **Follow Authors** — Follow users and see their published works
- 👤 **Author Profile** — Public profile with bio, published stories, and stats

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
| GET | `/api/auth/profile/:id` | — | Get public profile |
| PUT | `/api/auth/profile` | `{ name?, bio?, avatar? }` | Update profile |

### Stories
| Method | Route | Body | Description |
|--------|-------|------|-------------|
| GET | `/api/stories` | — | Browse published stories (with filters) |
| GET | `/api/stories/trending` | — | Get trending stories |
| GET | `/api/stories/recent` | — | Get recent stories |
| GET | `/api/stories/my` | — | Get user's own stories |
| GET | `/api/stories/:id` | — | Get story with chapter list |
| POST | `/api/stories` | `{ title, description, genre, ... }` | Create story |
| PUT | `/api/stories/:id` | any fields | Update story |
| DELETE | `/api/stories/:id` | — | Delete story |
| POST | `/api/stories/:id/like` | — | Toggle like |

### Chapters
| Method | Route | Body | Description |
|--------|-------|------|-------------|
| GET | `/api/chapters/story/:storyId` | — | List published chapters |
| GET | `/api/chapters/:id` | — | Read a chapter |
| POST | `/api/chapters/story/:storyId` | `{ title, content }` | Add chapter |
| PUT | `/api/chapters/:id` | any fields | Edit chapter |
| DELETE | `/api/chapters/:id` | — | Delete chapter |

### Comments
| Method | Route | Body | Description |
|--------|-------|------|-------------|
| GET | `/api/comments/chapter/:chapterId` | — | List comments |
| POST | `/api/comments/chapter/:chapterId` | `{ content, storyId }` | Post comment |
| DELETE | `/api/comments/:id` | — | Delete comment |
| POST | `/api/comments/:id/like` | — | Toggle like |

### Users
| Method | Route | Body | Description |
|--------|-------|------|-------------|
| GET | `/api/users/:id` | — | Public profile with stories |
| POST | `/api/users/:id/follow` | — | Toggle follow |
| GET | `/api/users/reading-list` | — | Get reading list |
| POST | `/api/users/reading-list/:storyId` | — | Toggle reading list |

## Deploy

### Docker
```bash
docker build -t inkwell .
docker run -p 3000:3000 -e JWT_SECRET=yoursecret -e MONGO_URI=your_uri inkwell
```

### Vercel
```bash
npm i -g vercel
vercel --prod
```
Set `JWT_SECRET` and `MONGO_URI` as environment variables in the Vercel dashboard.
