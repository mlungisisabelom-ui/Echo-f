import express from 'express';
import { body } from 'express-validator';
import { generateCode, getUserGenerations, getGenerationById } from '../controllers/generationController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Validation rules
const generationValidation = [
  body('prompt').trim().isLength({ min: 10, max: 2000 }).withMessage('Prompt must be between 10 and 2000 characters'),
  body('stack').isIn(['react', 'vue', 'angular', 'node', 'python', 'html-css-js', 'react-native', 'electron', 'node-react-fullstack']).withMessage('Invalid technology stack'),
  body('output').isIn(['preview', 'deploy', 'download']).withMessage('Invalid output type')
];

// Routes
router.post('/', protect, generationValidation, generateCode);
router.get('/', protect, getUserGenerations);
router.get('/:id', protect, getGenerationById);

export default router;
