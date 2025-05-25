import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db';
  await mongoose.connect(MONGODB_URI);
});

afterAll(async () => {
  await mongoose.connection.close();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}); 