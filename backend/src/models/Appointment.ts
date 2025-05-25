import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  type: 'presencial' | 'remota';
  status: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  reason: string;
  notes?: string;
  diagnosis?: string;
  prescription?: {
    medications: {
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }[];
    instructions: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['presencial', 'remota'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pendiente', 'confirmada', 'cancelada', 'completada'],
      default: 'pendiente',
    },
    reason: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    diagnosis: {
      type: String,
    },
    prescription: {
      medications: [
        {
          name: String,
          dosage: String,
          frequency: String,
          duration: String,
        },
      ],
      instructions: String,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para mejorar el rendimiento de las consultas
appointmentSchema.index({ patient: 1, date: 1 });
appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ status: 1 });

export default mongoose.model<IAppointment>('Appointment', appointmentSchema); 