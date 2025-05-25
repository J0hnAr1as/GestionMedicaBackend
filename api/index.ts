import { app } from '../backend/src/index';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

// Crear una nueva instancia de la aplicación para Vercel
const vercelApp = express();

// Configuración de CORS
vercelApp.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Aplicar middleware y configuraciones
vercelApp.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000']
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Middleware para parsear JSON
vercelApp.use(express.json());

// Usar todas las rutas y middleware de la aplicación principal
vercelApp.use('/api', app);

// Ruta de health check para Vercel
vercelApp.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    message: 'API is running'
  });
});

// Manejador de rutas no encontradas
vercelApp.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    message: 'La ruta solicitada no existe'
  });
});

// Exportar la aplicación para Vercel
export default vercelApp; 