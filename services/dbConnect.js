import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function connectMongo() {
  try {
    console.log("Connecting to MongoDB...");
    const options = {
    
   
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(process.env.DB_URI, options);
    console.log("✅ MongoDB connected successfully");

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected");
    });

    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        console.log("✅ MongoDB connection closed through app termination");
        process.exit(0);
      } catch (err) {
        console.error("❌ Error closing MongoDB connection:", err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

export default connectMongo;