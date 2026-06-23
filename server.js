require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const mongoose = require('mongoose');

const authRoutes  = require('./routes/auth');
const booksRoutes = require('./routes/books');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ─────────── MongoDB Connection ─────────── */
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('❌  MONGO_URI is not set in your .env file. Exiting.');
    process.exit(1);
}

mongoose
    .connect(MONGO_URI)
    .then(() => console.log('✅  Connected to MongoDB Atlas'))
    .catch(err => {
        console.error('❌  MongoDB connection error:', err.message);
        process.exit(1);
    });

// Optional: log mongoose queries in development
if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', false); // set to true to see all queries
}

/* ─────────── Middleware ─────────── */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ─────────── API Routes ─────────── */
app.use('/api/auth',  authRoutes);
app.use('/api/books', booksRoutes);

/* ─────────── Health Check ─────────── */
app.get('/api/health', (req, res) => {
    const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.json({
        status: 'ok',
        db:     dbState[mongoose.connection.readyState] || 'unknown',
        timestamp: new Date().toISOString(),
    });
});

/* ─────────── SPA Fallback ─────────── */
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ─────────── Start Server ─────────── */
app.listen(PORT, () => {
    console.log(`📚  BookShelf running at http://localhost:${PORT}`);
});
