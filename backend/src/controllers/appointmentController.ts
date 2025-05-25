import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Appointment, { IAppointment } from '../models/Appointment';
import User from '../models/User';

export const createAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { patientId, doctorId, date, time, type, notes } = req.body;

    // Verificar si el paciente existe
    const patient = await User.findOne({ _id: patientId, role: 'patient' });
    if (!patient) {
      res.status(404).json({
        message: 'Paciente no encontrado'
      });
      return;
    }

    // Verificar si el doctor existe
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      res.status(404).json({
        message: 'Doctor no encontrado'
      });
      return;
    }

    // Verificar disponibilidad
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date,
      time,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      res.status(400).json({
        message: 'El doctor ya tiene una cita programada en ese horario'
      });
      return;
    }

    // Crear la cita
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      date,
      time,
      type,
      notes,
      status: 'scheduled'
    });

    await appointment.save();

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error al crear cita:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const getAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.user!;
    const { startDate, endDate, status } = req.query;
    const query: any = {};

    // Filtrar por fecha si se proporciona
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    // Filtrar por estado si se proporciona
    if (status) {
      query.status = status;
    }

    // Filtrar por rol del usuario
    if (role === 'patient') {
      query.patient = req.user!.id;
    } else if (role === 'doctor') {
      query.doctor = req.user!.id;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name documentId')
      .populate('doctor', 'name specialty')
      .sort({ date: 1, startTime: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ message: 'Error al obtener las citas', error });
  }
};

export const getAppointmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name documentId birthDate phone')
      .populate('doctor', 'name specialty licenseNumber');

    if (!appointment) {
      res.status(404).json({ message: 'Cita no encontrada' });
      return;
    }

    // Verificar permisos
    const { role } = req.user!;
    if (
      role !== 'admin' &&
      appointment.patient._id.toString() !== req.user!.id &&
      appointment.doctor._id.toString() !== req.user!.id
    ) {
      res.status(403).json({
        message: 'No tiene permisos para ver esta cita',
      });
      return;
    }

    res.json(appointment);
  } catch (error) {
    console.error('Error al obtener cita:', error);
    res.status(500).json({ message: 'Error al obtener la cita', error });
  }
};

export const updateAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      res.status(404).json({ message: 'Cita no encontrada' });
      return;
    }

    // Verificar permisos
    const { role } = req.user!;
    if (
      role !== 'admin' &&
      appointment.doctor._id.toString() !== req.user!.id
    ) {
      res.status(403).json({
        message: 'No tiene permisos para modificar esta cita',
      });
      return;
    }

    const {
      date,
      startTime,
      endTime,
      type,
      status,
      notes,
      diagnosis,
      prescription,
    } = req.body;

    // Actualizar solo los campos proporcionados
    if (date) appointment.date = date;
    if (startTime) appointment.startTime = startTime;
    if (endTime) appointment.endTime = endTime;
    if (type) appointment.type = type;
    if (status) appointment.status = status;
    if (notes) appointment.notes = notes;
    if (diagnosis) appointment.diagnosis = diagnosis;
    if (prescription) appointment.prescription = prescription;

    await appointment.save();
    res.json(appointment);
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    res.status(500).json({ message: 'Error al actualizar la cita', error });
  }
};

export const cancelAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      res.status(404).json({ message: 'Cita no encontrada' });
      return;
    }

    // Verificar permisos
    const { role } = req.user!;
    if (
      role !== 'admin' &&
      appointment.patient._id.toString() !== req.user!.id &&
      appointment.doctor._id.toString() !== req.user!.id
    ) {
      res.status(403).json({
        message: 'No tiene permisos para cancelar esta cita',
      });
      return;
    }

    appointment.status = 'cancelada';
    await appointment.save();
    res.json({ message: 'Cita cancelada exitosamente' });
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    res.status(500).json({ message: 'Error al cancelar la cita', error });
  }
}; 