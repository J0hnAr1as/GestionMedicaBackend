import { Router, Request, Response, NextFunction } from 'express';
import { body, query } from 'express-validator';
import { auth, checkRole } from '../middleware/auth';
import { validationResult } from 'express-validator';
import MedicalRecord from '../models/MedicalRecord';

const router = Router();

// Middleware para manejar errores de validación
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

// Validación para crear/actualizar historia médica
const medicalRecordValidation = [
  body('patient')
    .notEmpty()
    .withMessage('El ID del paciente es requerido'),
  body('doctor')
    .notEmpty()
    .withMessage('El ID del doctor es requerido'),
  body('type')
    .isIn(['consulta', 'emergencia', 'control', 'procedimiento'])
    .withMessage('Tipo de consulta inválido'),
  body('symptoms')
    .optional()
    .isArray()
    .withMessage('Los síntomas deben ser un array'),
  body('diagnosis')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El diagnóstico no puede estar vacío'),
  body('treatment')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El tratamiento no puede estar vacío'),
  body('vitalSigns')
    .optional()
    .isObject()
    .withMessage('Los signos vitales deben ser un objeto'),
  body('vitalSigns.bloodPressure')
    .optional()
    .matches(/^\d{2,3}\/\d{2,3}$/)
    .withMessage('Presión arterial inválida (formato: 120/80)'),
  body('vitalSigns.heartRate')
    .optional()
    .isInt({ min: 40, max: 200 })
    .withMessage('Frecuencia cardíaca inválida'),
  body('vitalSigns.temperature')
    .optional()
    .isFloat({ min: 35, max: 42 })
    .withMessage('Temperatura inválida'),
  body('vitalSigns.oxygenSaturation')
    .optional()
    .isFloat({ min: 70, max: 100 })
    .withMessage('Saturación de oxígeno inválida'),
  handleValidationErrors
];

// Validación para filtros de búsqueda
const searchValidation = [
  query('patientId')
    .optional()
    .notEmpty()
    .withMessage('ID de paciente inválido'),
  query('doctorId')
    .optional()
    .notEmpty()
    .withMessage('ID de doctor inválido'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin inválida'),
  query('type')
    .optional()
    .isIn(['consulta', 'emergencia', 'control', 'procedimiento'])
    .withMessage('Tipo de consulta inválido'),
  handleValidationErrors
];

// Controladores
const createMedicalRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const medicalRecord = new MedicalRecord({
      ...req.body,
      createdBy: req.user?.id
    });
    await medicalRecord.save();
    res.status(201).json(medicalRecord);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el registro médico' });
  }
};

const getMedicalRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patient, doctor, startDate, endDate, type } = req.query;
    const query: any = {};

    if (patient) query.patient = patient;
    if (doctor) query.doctor = doctor;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    // Si es paciente, solo puede ver sus propias historias
    if (req.user?.role === 'patient') {
      query.patient = req.user.id;
    }
    // Si es doctor, solo puede ver las historias de sus pacientes
    else if (req.user?.role === 'doctor') {
      query.doctor = req.user.id;
    }

    const records = await MedicalRecord.find(query)
      .populate('patient', 'name documentId')
      .populate('doctor', 'name specialty')
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    next(error);
  }
};

const getMedicalRecordById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('doctor', 'name email');

    if (!record) {
      res.status(404).json({ message: 'Registro médico no encontrado' });
      return;
    }

    // Verificar permisos
    if (req.user?.role === 'patient' && record.patient._id.toString() !== req.user.id) {
      res.status(403).json({ message: 'No tienes permiso para ver este registro' });
      return;
    }

    if (req.user?.role === 'doctor' && record.doctor._id.toString() !== req.user.id) {
      res.status(403).json({ message: 'No tienes permiso para ver este registro' });
      return;
    }

    res.json(record);
  } catch (error) {
    console.error('Error al obtener registro médico:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const updateMedicalRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      res.status(404).json({ message: 'Registro médico no encontrado' });
      return;
    }

    // Verificar permisos
    if (req.user?.role === 'doctor' && record.doctor.toString() !== req.user.id) {
      res.status(403).json({ message: 'No tienes permiso para actualizar este registro' });
      return;
    }

    Object.assign(record, req.body);
    await record.save();
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el registro médico' });
  }
};

// Rutas
router.post('/', auth, checkRole(['doctor', 'admin']), medicalRecordValidation, createMedicalRecord);
router.get('/', auth, searchValidation, getMedicalRecords);
router.get('/:id', auth, getMedicalRecordById);
router.put('/:id', auth, checkRole(['doctor', 'admin']), medicalRecordValidation, updateMedicalRecord);

export default router; 