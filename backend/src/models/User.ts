import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor' | 'admin';
  documentId: string;
  birthDate: Date;
  phone: string;
  address: string;
  medicalHistory?: string;
  healthCoverage?: string;
  specialty?: string;
  licenseNumber?: string;
  schedule?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un email válido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es requerida'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      required: [true, 'El rol es requerido'],
    },
    documentId: {
      type: String,
      required: [true, 'El documento de identidad es requerido'],
      trim: true,
    },
    birthDate: {
      type: Date,
      required: [true, 'La fecha de nacimiento es requerida'],
    },
    phone: {
      type: String,
      required: [true, 'El teléfono es requerido'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'La dirección es requerida'],
      trim: true,
    },
    medicalHistory: {
      type: String,
    },
    healthCoverage: {
      type: String,
    },
    specialty: {
      type: String,
    },
    licenseNumber: {
      type: String,
    },
    schedule: [
      {
        day: {
          type: String,
          enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        },
        startTime: String,
        endTime: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Middleware para encriptar la contraseña antes de guardar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Índices para búsquedas frecuentes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ documentId: 1 }, { unique: true });

const User = mongoose.model<IUser>('User', userSchema);

export default User; 