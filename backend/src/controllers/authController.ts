import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { MongoError } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura';

export const register = async (req: Request, res: Response): Promise<Response> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, role, documentId, documentType } = req.body;

        // Verificar si el usuario ya existe
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // Crear nuevo usuario
        user = new User({
            name,
            email,
            password,
            role,
            documentId,
            documentType
        });

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Guardar usuario
        await user.save();

        // Crear y devolver el token
        const payload = {
            id: user._id,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({ 
            token, 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role 
            } 
        });
    } catch (error) {
        console.error('Error en registro:', error);
        if (error instanceof MongoError && error.code === 11000) {
            const mongoError = error as MongoError & { keyPattern: Record<string, number> };
            const field = Object.keys(mongoError.keyPattern)[0];
            return res.status(400).json({ 
                message: `Ya existe un usuario con ese ${field === 'email' ? 'correo electrónico' : 'documento'}`
            });
        }
        return res.status(500).json({ message: 'Error en el servidor' });
    }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Generar token
        const payload = {
            id: user._id,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
};

export const getProfile = async (req: Request, res: Response): Promise<Response> => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        return res.json(user);
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        return res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Extender la interfaz Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
} 