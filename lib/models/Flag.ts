import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IFlag extends Document {
  monitorId: Types.ObjectId;
  targetId: Types.ObjectId;
  observation: string;
  justification: string | null;
  status: "pending_justification" | "pending_audit" | "cleared" | "caught";
  auditReason: string | null;
  createdAt: Date;
}

const FlagSchema = new Schema<IFlag>(
  {
    monitorId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    targetId: { type: Schema.Types.ObjectId, ref: "Player", required: true },
    observation: { type: String, required: true },
    justification: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending_justification", "pending_audit", "cleared", "caught"],
      default: "pending_justification",
    },
    auditReason: { type: String, default: null },
  },
  { timestamps: true }
);

export const Flag: Model<IFlag> =
  mongoose.models.Flag || mongoose.model<IFlag>("Flag", FlagSchema);
