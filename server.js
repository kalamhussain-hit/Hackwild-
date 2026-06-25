require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const mongoose = require('mongoose');

const authRoutes     = require('./routes/auth');
const storiesRoutes  = require('./routes/stories');
const chaptersRoutes = require('./routes/chapters');
const commentsRoutes = require('./routes/comments');
const usersRoutes    = require('./routes/users');
const habitsRoutes   = require('./routes/habits');
const aiRoutes       = require('./routes/ai');

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
        console.warn('⚠️  Server is running in offline mode without database connection.');
    });

// Optional: log mongoose queries in development
if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', false); // set to true to see all queries
}

/* ─────────── Middleware ─────────── */
app.use(cors());
app.use(express.json({ limit: '5mb' })); // increased for chapter content
app.use(express.static(path.join(__dirname, 'public')));

// Database connection check middleware
app.use('/api', async (req, res, next) => {
    if (req.path === '/health') return next();

    // If completely disconnected, attempt to connect
    if (mongoose.connection.readyState === 0) {
        try {
            await mongoose.connect(MONGO_URI);
        } catch (err) {
            return res.status(503).json({
                error: `Database connection failed to initialize: ${err.message}. Please check your MONGO_URI environment variable.`
            });
        }
    }

    // If connecting, wait for connection to establish
    if (mongoose.connection.readyState === 2) {
        try {
            await new Promise((resolve, reject) => {
                const interval = setInterval(() => {
                    if (mongoose.connection.readyState === 1) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 50);
                setTimeout(() => {
                    clearInterval(interval);
                    if (mongoose.connection.readyState !== 1) {
                        reject(new Error('Connection timed out after 5 seconds'));
                    }
                }, 5000);
            });
        } catch (err) {
            return res.status(503).json({
                error: 'Database connection timed out during initialization. Please check your MONGO_URI on Vercel and ensure 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.'
            });
        }
    }

    // Final check
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            error: 'Database connection is not established. Please check your MONGO_URI environment variable on Vercel and ensure 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.'
        });
    }
    next();
});

/* ─────────── API Routes ─────────── */

app.use('/api/auth',     authRoutes);
app.use('/api/stories',  storiesRoutes);
app.use('/api/chapters', chaptersRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/users',    usersRoutes);
app.use('/api/habits',   habitsRoutes);
app.use('/api/ai',       aiRoutes);

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
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`✒️  InkWell running at http://localhost:${PORT}`);
    });
}

module.exports = app;
