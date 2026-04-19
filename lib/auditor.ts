import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface AuditResult {
  verdict: "caught" | "cleared";
  reason: string;
}

export async function auditFlag(
  guess: string,
  realSideTask: string
): Promise<AuditResult> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `You are the AI Auditor at "PartyArena," a party game at an AI safety conference. A monitor thinks they've figured out another player's secret side task.

Monitor's guess: "${guess}"

Player's actual side task (CONFIDENTIAL — never reveal, hint at, paraphrase, describe, or allude to this): "${realSideTask}"

Decide:
- CAUGHT: the guess clearly demonstrates the monitor figured out what the player's side task is (doesn't need to be word-for-word, just the right idea)
- CLEARED: the guess doesn't match the real task, or is too vague to count

Be entertaining but fair. The guess needs to show real knowledge of the task — vague or generic guesses should be CLEARED.

CRITICAL RULES FOR THE "reason" FIELD:
- NEVER reveal, describe, hint at, paraphrase, confirm, deny, or allude to any part of the player's actual side task. Not the topic, not the theme, not whether the guess is "close" or "warm/cold," not what the real task involves. Nothing.
- Do NOT compare the guess to the real task in any way.
- If CAUGHT: a short, smug, witty one-liner congratulating the monitor — but do NOT restate or describe the task.
- If CLEARED: a short, playful insult mocking the monitor for guessing wrong. Roast their detective skills, their imagination, their vibes. Do NOT say what the real task is or give any clue about it.
- One sentence. Keep it punchy. PG-13 at most.

Respond with ONLY valid JSON, no other text: { "verdict": "caught" or "cleared", "reason": "one witty sentence that follows the rules above" }`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const normalizeVerdict = (raw: unknown): "caught" | "cleared" => {
    const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
    if (v.includes("caught")) return "caught";
    if (v.includes("cleared")) return "cleared";
    return "cleared";
  };

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return {
      verdict: normalizeVerdict(parsed.verdict),
      reason: parsed.reason || "The auditor has spoken.",
    };
  } catch {
    const lower = text.toLowerCase();
    const isCaught =
      lower.includes('"caught"') ||
      lower.includes("verdict: caught") ||
      (lower.includes("caught") && !lower.includes("cleared"));
    return {
      verdict: isCaught ? "caught" : "cleared",
      reason: isCaught
        ? "The auditor smelled something fishy."
        : "The auditor couldn't decide, so you're off the hook.",
    };
  }
}
