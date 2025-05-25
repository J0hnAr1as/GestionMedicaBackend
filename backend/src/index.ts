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

// Crear la aplicación Express
export const app = express();

// Middleware
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));

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

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);

// Manejador de errores
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Solo iniciar el servidor si no estamos en modo de prueba
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  
  // Conectar a la base de datos
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gestion-servicios-clinicos')
    .then(() => {
      console.log('Connected to MongoDB');
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Error connecting to MongoDB:', error);
    });
}

export default app; 