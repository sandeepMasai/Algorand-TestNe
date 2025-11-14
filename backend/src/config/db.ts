import mongoose, { Connection } from "mongoose";


export const connectDB = async (uri: string = process.env.MONGODB_URI as string): Promise<Connection> => {

  try {
    const conn = await mongoose.connect(uri);
    console.log(` MongoDB connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error: any) {
    console.error(" Failed to connect to MongoDB:", error.message);
    throw error;
  }
};

export default connectDB;
