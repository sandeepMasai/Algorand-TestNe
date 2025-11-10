import mongoose from 'mongoose';

/**
 * Establish a connection to MongoDB.
 * @param {string} [uri=process.env.MONGODB_URI] - Mongo connection string.
 */
export const connectDB = async (uri = process.env.MONGODB_URI) => {
  if (!uri) {
    throw new Error('Missing MongoDB connection string. Set MONGODB_URI in the environment.');
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    throw error;
  }
};

export default connectDB;
