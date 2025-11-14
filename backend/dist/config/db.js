"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async (uri = process.env.MONGODB_URI) => {
    try {
        const conn = await mongoose_1.default.connect(uri);
        console.log(` MongoDB connected: ${conn.connection.host}`);
        return conn.connection;
    }
    catch (error) {
        console.error(" Failed to connect to MongoDB:", error.message);
        throw error;
    }
};
exports.connectDB = connectDB;
exports.default = exports.connectDB;
