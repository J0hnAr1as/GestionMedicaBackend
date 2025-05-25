import { Router, Request, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
} from '../controllers/appointmentController';
import { auth, checkRole } from '../middleware/auth';
import { validationResult } from 'express-validator';
import Appointment from '../models/Appointment';

const router = Router();

// Middleware para manejar errores de validación
const handleValidationErrors = (req: Request, res: Response, next: Function): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

// Validación para crear/actualizar cita
const appointmentValidation = [
  body('patientId').notEmpty().withMessage('El ID del paciente es requerido'),
  body('doctorId').notEmpty().withMessage('El ID del doctor es requerido'),
  body('date').isDate().withMessage('La fecha debe ser válida'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('La hora debe tener formato HH:mm'),
  body('reason').notEmpty().withMessage('La razón de la cita es requerida'),
  handleValidationErrors
];

// Validación para actualizar diagnóstico y prescripción
const medicalUpdateValidation = [
  body('diagnosis')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El diagnóstico no puede estar vacío'),
  body('prescription.medications')
    .optional()
    .isArray()
    .withMessage('Las medicaciones deben ser un array'),
  body('prescription.medications.*.name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre del medicamento es requerido'),
  body('prescription.medications.*.dosage')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('La dosis es requerida'),
  body('prescription.medications.*.frequency')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('La frecuencia es requerida'),
  body('prescription.medications.*.duration')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('La duración es requerida'),
];

// Validación para filtros de búsqueda
const searchValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin inválida'),
  query('status')
    .optional()
    .isIn(['pendiente', 'confirmada', 'cancelada', 'completada'])
    .withMessage('Estado inválido'),
];

// Rutas
router.post('/', auth, checkRole(['admin', 'doctor']), appointmentValidation, createAppointment);
router.get('/', auth, searchValidation, getAppointments);
router.get('/:id', auth, getAppointmentById);
router.put('/:id', auth, checkRole(['admin', 'doctor']), appointmentValidation, updateAppointment);
router.patch('/:id/cancel', auth, cancelAppointment);

export default router; 