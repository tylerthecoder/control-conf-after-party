import { SessionOptions } from "iron-session";

export interface SessionData {
  playerId?: string;
  name?: string;
  role?: "player" | "monitor";
  isAdmin?: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long_fallback",
  cookieName: "the-eval-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};
