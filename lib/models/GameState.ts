import mongoose, { Schema, Model } from "mongoose";

export interface IGameState {
  _id: string;
  status: "active" | "inactive";
  startedAt: Date | null;
}

const GameStateSchema = new Schema<IGameState>({
  _id: { type: String, default: "game" },
  status: { type: String, enum: ["active", "inactive"], default: "inactive" },
  startedAt: { type: Date, default: null },
});

export const GameState: Model<IGameState> =
  mongoose.models.GameState ||
  mongoose.model<IGameState>("GameState", GameStateSchema);

export async function getGameState(): Promise<IGameState> {
  let state = await GameState.findById("game");
  if (!state) {
    state = await GameState.create({ _id: "game", status: "inactive" });
  }
  return state;
}
