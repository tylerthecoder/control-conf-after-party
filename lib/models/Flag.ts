import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IFlag extends Document {
  monitorId: Types.ObjectId;
  targetId: Types.ObjectId;
  guess: string;
  selfReport: boolean;
  status: "pending" | "cleared" | "caught";
  auditReason: string | null;
  createdAt: Date;
}

const FlagSchema = new Schema<IFlag>(
  {
    monitorId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    targetId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    guess: { type: String, required: true },
    selfReport: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "cleared", "caught"],
      default: "pending",
    },
    auditReason: { type: String, default: null },
  },
  { timestamps: true }
);

if (mongoose.models.Flag) {
  delete (mongoose.models as Record<string, unknown>).Flag;
}

export const Flag: Model<IFlag> = mongoose.model<IFlag>("Flag", FlagSchema);
