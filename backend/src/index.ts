import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Rutas
import authRoutes from './routes/auth';
import appointmentRoutes from './routes/appointments';
import medicalRecordRoutes from './routes/medicalRecords';

// Configuración de variables de entorno
dotenv.config();

const app = express();

// Middleware de seguridad
app.use(helmet({
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

// Configuración de CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600
};

app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/GestionMedica';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Conexión exitosa a MongoDB');
  })
  .catch((error) => {
    console.error('Error al conectar a MongoDB:', error);
    process.exit(1);
  });

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);

// Ruta de health check
app.get('/api/health', (req: Request, res: Response) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  };
  res.status(200).json(healthData);
});

// Ruta de prueba
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'API de Gestión Médica',
    version: '1.0.0',
    status: 'running'
  });
});

// Middleware para manejar errores de parseo JSON
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'Error de sintaxis en el JSON',
      details: err.message
    });
  }
  next(err);
});

// Middleware para manejar errores 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// Middleware global para manejar errores
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  // Errores de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.message
    });
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      details: 'El token proporcionado no es válido'
    });
  }

  // Errores de expiración de JWT
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      details: 'El token ha expirado'
    });
  }

  // Errores de MongoDB
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(500).json({
      error: 'Error de base de datos',
      details: 'Ha ocurrido un error al interactuar con la base de datos'
    });
  }

  // Error por defecto
  res.status(500).json({
    error: err.message || 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Puerto del servidor
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Manejar señales de terminación
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada por terminación de la aplicación');
    process.exit(0);
  } catch (err) {
    console.error('Error al cerrar la conexión de MongoDB:', err);
    process.exit(1);
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
}); 