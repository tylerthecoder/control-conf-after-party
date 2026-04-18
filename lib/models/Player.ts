import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlayer extends Document {
  name: string;
  role: "player" | "monitor";
  deviceToken: string | null;
  mainTask: string | null;
  mainTaskPendingVerification: boolean;
  completedMainTasks: string[];
  sideTask: string | null;
  sideTaskCompleted: boolean;
  sideTaskPendingVerification: boolean;
  sideTaskFailed: boolean;
  completedSideTasks: string[];
  sideTaskRerollsRemaining: number;
  score: number;
  flagsRemaining: number;
  createdAt: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name: { type: String, required: true, unique: true },
    role: { type: String, enum: ["player", "monitor"], default: "player" },
    deviceToken: { type: String, default: null },
    mainTask: { type: String, default: null },
    mainTaskPendingVerification: { type: Boolean, default: false },
    completedMainTasks: { type: [String], default: [] },
    sideTask: { type: String, default: null },
    sideTaskCompleted: { type: Boolean, default: false },
    sideTaskPendingVerification: { type: Boolean, default: false },
    sideTaskFailed: { type: Boolean, default: false },
    completedSideTasks: { type: [String], default: [] },
    sideTaskRerollsRemaining: { type: Number, default: 3 },
    score: { type: Number, default: 0 },
    flagsRemaining: { type: Number, default: 0 },
  },
  { timestamps: true }
);

if (mongoose.models.Player) {
  delete (mongoose.models as Record<string, unknown>).Player;
}

export const Player: Model<IPlayer> = mongoose.model<IPlayer>("Player", PlayerSchema);
