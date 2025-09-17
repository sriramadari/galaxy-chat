import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
type MongooseGlobal = {
  mongoose?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

let cached = (global as typeof global & MongooseGlobal).mongoose;

if (!cached) {
  cached = (global as typeof global & { mongoose?: MongooseGlobal["mongoose"] }).mongoose = {
    conn: null,
    promise: null,
  };
}

async function dbConnect() {
  cached ??= (global as typeof global & { mongoose?: MongooseGlobal["mongoose"] }).mongoose = {
    conn: null,
    promise: null,
  };

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
