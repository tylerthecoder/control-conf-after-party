import Anthropic from "@anthropic-ai/sdk";
import { sideTasks } from "./tasks";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface AuditResult {
  verdict: "caught" | "cleared";
  reason: string;
}

export async function auditFlag(
  observation: string,
  justification: string
): Promise<AuditResult> {
  const taskList = sideTasks.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `You are the AI Auditor at "The Eval," a party game at an AI safety conference. A monitor flagged a guest for suspicious behavior.

Monitor's observation: "${observation}"

Guest's justification: "${justification}"

Here is the full list of possible covert side tasks any guest might have:
${taskList}

Decide:
- CAUGHT: the observation clearly describes behavior matching a side task and the justification doesn't convincingly explain it away
- CLEARED: the justification is plausible or the observation is too vague

Be entertaining but fair. Lean toward CLEARED if it's ambiguous — innocent until proven guilty.

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
