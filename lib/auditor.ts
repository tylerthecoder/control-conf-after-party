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

Player's actual side task: "${realSideTask}"

Decide:
- CAUGHT: the guess clearly demonstrates the monitor figured out what the player's side task is (doesn't need to be word-for-word, just the right idea)
- CLEARED: the guess doesn't match the real task, or is too vague to count

Be entertaining but fair. The guess needs to show real knowledge of the task — vague or generic guesses should be CLEARED.

Respond with ONLY valid JSON, no other text: { "verdict": "caught" or "cleared", "reason": "one witty sentence" }`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return {
      verdict: parsed.verdict === "caught" ? "caught" : "cleared",
      reason: parsed.reason || "The auditor has spoken.",
    };
  } catch {
    const isCaught = text.toLowerCase().includes("caught");
    return {
      verdict: isCaught ? "caught" : "cleared",
      reason: isCaught
        ? "The auditor smelled something fishy."
        : "The auditor couldn't decide, so you're off the hook.",
    };
  }
}
