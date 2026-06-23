# BookShelf — Personal Book Library

A full-stack Node.js book tracking app with JWT authentication.

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

### Books (all require `Authorization: Bearer <token>`)
| Method | Route | Body | Description |
|--------|-------|------|-------------|
| GET | `/api/books` | — | List user's books |
| GET | `/api/books/:id` | — | Get single book |
| POST | `/api/books` | `{ title, author, genre, status?, rating?, notes? }` | Add book |
| PUT | `/api/books/:id` | any fields | Update book |
| DELETE | `/api/books/:id` | — | Delete book |

## Deploy

### Docker
```bash
docker build -t bookshelf .
docker run -p 3000:3000 -e JWT_SECRET=yoursecret bookshelf
```

### Vercel
```bash
npm i -g vercel
vercel --prod
```
Set `JWT_SECRET` as an environment variable in the Vercel dashboard.
