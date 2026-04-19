import mongoose, { Schema, Document, Model } from "mongoose";

export type ActivityType =
  | "side_task_completed"
  | "main_task_completed"
  | "flag_caught"
  | "flag_cleared";

export interface IActivity extends Document {
  type: ActivityType;
  playerName: string;
  targetName: string | null;
  task: string | null;
  guess: string | null;
  reason: string | null;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      enum: [
        "side_task_completed",
        "main_task_completed",
        "flag_caught",
        "flag_cleared",
      ],
      required: true,
    },
    playerName: { type: String, required: true },
    targetName: { type: String, default: null },
    task: { type: String, default: null },
    guess: { type: String, default: null },
    reason: { type: String, default: null },
  },
  { timestamps: true }
);

ActivitySchema.index({ createdAt: -1 });

if (mongoose.models.Activity) {
  delete (mongoose.models as Record<string, unknown>).Activity;
}

export const Activity: Model<IActivity> = mongoose.model<IActivity>(
  "Activity",
  ActivitySchema
);
