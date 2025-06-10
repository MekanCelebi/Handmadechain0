import express from 'express';
import { register, login, listUsers, getCurrentUser } from '../controllers/auth.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me
router.get('/me', auth, getCurrentUser);

// GET /api/auth/users
router.get('/users', listUsers);

export default router; 