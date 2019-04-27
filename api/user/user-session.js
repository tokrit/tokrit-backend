const express = require('express');
const router = express.Router();

const oneDay = 86400000; // 1000ms * 60 * 60 * 24 = prune expired entries after 1day
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const sessionStore = new MemoryStore({
    checkPeriod: oneDay
});
router.use(session({
    cookie: { maxAge: oneDay },
    store: sessionStore,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET
}));