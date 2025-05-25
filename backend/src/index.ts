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

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/GestionMedica';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Conexión exitosa a MongoDB');
  })
  .catch((error) => {
    console.error('Error al conectar a MongoDB:', error);
  });

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de Gestión Médica' });
});

// Middleware para manejar errores 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware para manejar errores
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    message: err.message || 'Error en el servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Puerto del servidor
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
}); 