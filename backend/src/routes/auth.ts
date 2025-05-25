import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { register, login, getProfile } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Validaciones
const registerValidation = [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('role').isIn(['admin', 'doctor', 'patient']).withMessage('Rol inválido'),
    body('documentId').optional().isString(),
    body('documentType').optional().isString()
];

const loginValidation = [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
];

// Rutas
router.post('/register', registerValidation, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        await register(req, res);
    } catch (error) {
        next(error);
    }
});

router.post('/login', loginValidation, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        await login(req, res);
    } catch (error) {
        next(error);
    }
});

router.get('/profile', auth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await getProfile(req, res);
    } catch (error) {
        next(error);
    }
});

export default router; 