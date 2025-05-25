const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Importar rutas y middleware
const authRoutes = require('./src/routes/auth');
const doctorRoutes = require('./src/routes/doctor');
const patientRoutes = require('./src/routes/patient');
const appointmentRoutes = require('./src/routes/appointment');
const { errorHandler } = require('./src/middleware/errorHandler');
const { connectDB } = require('./src/config/database');

// Validación de variables de entorno requeridas
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Error: Faltan las siguientes variables de entorno requeridas:');
  missingEnvVars.forEach(envVar => console.error(`- ${envVar}`));
  process.exit(1);
}

// Inicializar la aplicación Express
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
  maxAge: 600 // 10 minutos
};

app.use(cors(corsOptions));

// Middleware de logging
app.use(morgan('dev'));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para manejar errores de parseo JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Error de sintaxis en el JSON',
      details: err.message
    });
  }
  next();
});

// Middleware para validar el formato de las peticiones
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!req.is('application/json')) {
      return res.status(415).json({
        error: 'Tipo de contenido no soportado',
        details: 'Se requiere application/json'
      });
    }
  }
  next();
});

// Conectar a la base de datos con manejo de errores
const initializeDatabase = async () => {
  try {
    await connectDB();
    console.log('Conexión a la base de datos establecida');
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    process.exit(1);
  }
};

initializeDatabase();

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);

// Ruta para verificar el estado del servidor
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Manejador de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
    method: req.method
  });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);

  // Errores de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: Object.values(err.errors).map(e => e.message)
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
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Manejadores de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Excepción no capturada:', error);
  // Dar tiempo para que se registren los logs antes de cerrar
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
  // Dar tiempo para que se registren los logs antes de cerrar
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Exportar la app para Vercel
module.exports = app; 