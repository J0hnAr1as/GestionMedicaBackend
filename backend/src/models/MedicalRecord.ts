import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicalRecord extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  date: Date;
  type: 'consulta' | 'emergencia' | 'control' | 'procedimiento';
  symptoms: string[];
  diagnosis: string;
  treatment: {
    medications: {
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      startDate: Date;
      endDate?: Date;
    }[];
    procedures?: {
      name: string;
      date: Date;
      notes: string;
    }[];
    recommendations: string;
  };
  vitalSigns: {
    bloodPressure?: {
      systolic: number;
      diastolic: number;
    };
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
  };
  attachments?: {
    type: 'imagen' | 'documento' | 'laboratorio';
    name: string;
    url: string;
    description?: string;
  }[];
  notes: string;
  followUp?: {
    date: Date;
    notes: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const medicalRecordSchema = new Schema<IMedicalRecord>(
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
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['consulta', 'emergencia', 'control', 'procedimiento'],
      required: true,
    },
    symptoms: [{
      type: String,
      required: true,
    }],
    diagnosis: {
      type: String,
      required: true,
    },
    treatment: {
      medications: [{
        name: {
          type: String,
          required: true,
        },
        dosage: {
          type: String,
          required: true,
        },
        frequency: {
          type: String,
          required: true,
        },
        duration: {
          type: String,
          required: true,
        },
        startDate: {
          type: Date,
          required: true,
        },
        endDate: Date,
      }],
      procedures: [{
        name: String,
        date: Date,
        notes: String,
      }],
      recommendations: {
        type: String,
        required: true,
      },
    },
    vitalSigns: {
      bloodPressure: {
        systolic: Number,
        diastolic: Number,
      },
      heartRate: Number,
      temperature: Number,
      respiratoryRate: Number,
      oxygenSaturation: Number,
    },
    attachments: [{
      type: {
        type: String,
        enum: ['imagen', 'documento', 'laboratorio'],
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      description: String,
    }],
    notes: {
      type: String,
      required: true,
    },
    followUp: {
      date: Date,
      notes: String,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para mejorar el rendimiento de las consultas
medicalRecordSchema.index({ patient: 1, date: -1 });
medicalRecordSchema.index({ doctor: 1, date: -1 });
medicalRecordSchema.index({ type: 1 });

export default mongoose.model<IMedicalRecord>('MedicalRecord', medicalRecordSchema); 