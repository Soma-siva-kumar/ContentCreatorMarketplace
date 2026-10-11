import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(): Promise<typeof mongoose> {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('[Database] MongoDB Connection Error:', error);
    throw error;
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB Disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database] MongoDB Runtime Error:', err);
});
