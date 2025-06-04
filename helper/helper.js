import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    senderId: { type: String, required: true },
    recipientId: { type: String, required: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "delivered", "read"],
      default: "pending",
    }, 
  },
  { timestamps: true }
);

export const MessageModel = mongoose.model("Message", messageSchema);

export const handleMessage = async (message) => {
  try {
    console.log("💾 Saving message to DB:", message);
    const newMessage = new MessageModel({
      senderId: message.senderId,
      recipientId: message.recipientId,
      content: message.message,
      status :message.status,
      timestamp: new Date(),
    });

    await newMessage.save();
    console.log("✅ Message saved successfully!");
  } catch (error) {
    console.error("❌ Error saving message:", error);
  }
};
