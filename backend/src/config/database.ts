import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoURI, options);

    mongoose.connection.on('connected', () => {
      console.log('MongoDB conectado');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Error en la conexión de MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB desconectado');
    });

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

  } catch (error) {
    console.error('Error al conectar con MongoDB:', error);
    // Dar tiempo para que se registren los logs antes de cerrar
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
};

export { connectDB }; 