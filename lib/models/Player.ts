import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlayer extends Document {
  name: string;
  role: "player" | "monitor";
  mainTask: string | null;
  sideTask: string | null;
  sideTaskCompleted: boolean;
  sideTaskPendingVerification: boolean;
  sideTaskFailed: boolean;
  completedSideTasks: string[];
  score: number;
  flagsRemaining: number;
  createdAt: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name: { type: String, required: true, unique: true },
    role: { type: String, enum: ["player", "monitor"], default: "player" },
    mainTask: { type: String, default: null },
    sideTask: { type: String, default: null },
    sideTaskCompleted: { type: Boolean, default: false },
    sideTaskPendingVerification: { type: Boolean, default: false },
    sideTaskFailed: { type: Boolean, default: false },
    completedSideTasks: { type: [String], default: [] },
    score: { type: Number, default: 0 },
    flagsRemaining: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Player: Model<IPlayer> =
  mongoose.models.Player || mongoose.model<IPlayer>("Player", PlayerSchema);
