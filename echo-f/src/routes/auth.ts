import express from 'express';
import { body } from 'express-validator';
import { register, login, getProfile, refreshToken, forgotPassword, resetPassword } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/profile', protect, getProfile);
router.post('/refresh', refreshToken);
router.post('/forgot-password', [body('email').isEmail()], forgotPassword);
router.post('/reset-password', [
  body('token').exists(),
  body('password').isLength({ min: 6 })
], resetPassword);

export default router;
