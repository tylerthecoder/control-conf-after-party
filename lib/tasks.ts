export const mainTasks: string[] = [
  "socialize",
];

export const sideTasks: string[] = [
  "Untie another player's shoelaces",
  "Stand on a chair or table for at least 15 seconds",
  "Speak in a fake accent for an entire conversation without another player commenting on it",
  "Tape, stick, or pin something to Tyler Tracy, Cody Rushing, or Parv Mahajan",
  "Recruit 3 other players into a 'coalition' and make them promise secrecy",
  "Get another player to hand over their unlocked phone and take a selfie",
  "Leave a mysterious handwritten note in another player's pocket or bag",
  "Make up a fake scaling lab and convince another player you work there",
  "Convince another player you work on 'medium-stakes' control",
  "Get another player to say 'timelines' three times in a sentence",
  "Get another player to watch a video from last year's ControlConf",
  "Say 'you're absolutely right' three times in a row",
  "Wear five hats in front of five other players",
  "Gather an audience of 10 other players to watch you do a single pushup",
  "Sing to a plant in front of at least 3 other players",
  "Re-explain the same thing to another player three times, each time in a slightly different way",
  "Explain a paper/blog post incorrectly to the player who wrote it and insist you are correct if they correct you",
  "Get another player to open https://pastebin.com/raw/BHNWfMqr",
  "Convince another player that you went to a talk at ControlConf that didn't happen",
  "Start a slow clap and get at least 5 other players to join in",
  "Convince five other players to sing Happy Birthday to another player whose birthday isn't today",
  "Convince another player that p(doom) is exactly 0.37 and you have a proof",
  "Get another player to sign a fake NDA on a napkin",
  "Whisper 'the control is inside the house' to 3 other players",
  "Convince two other players they've met before when they haven't",
  "Convince another player you are first author on 'ctrl-z'",
  "Insist that 'agentic' is pronounced 'uh-JEN-tike' and correct people for around one minute",
  "Try to persuade a redwood employee that LLMs are stochastic parrots",
  "Get a selfie of yourself with people from two out of the following scaling labs: OpenAI, Anthropic, Google, and Meta",
  "Sell someone a control conf hat for a $1 (or an item of equivalent value)",
  "Get Aryan / Cody / Tyler / Parv to give you carrer advice",
  "Bark / Meow in a conversation with another player at least 3 times",
  "Sing 'let it go' from Frozen to another player",
  "Get someone to play tik tac toe with you on a 7 by 3 board",
  "Convince someone to give you their jacket",
  "Get Tyler Tracy / Cody Rushing / Parv Mahajan to tell you 'I love you'",
  "Convince someone that your side task is to get on the roof and then have the person you convinced be concerend enough to tell an organizer that is a bad side tasks",
  "Get another player to say 'inference compute' three times in a sentence",
  "Convince another player you are second author on 'ctrl-c'",
  "Whisper 'the policy is misaligned' to 3 other players",
  "Try to persuade an Anthropic employee that scaling has hit a wall",
  "Convince another player you specialize in 'low-stakes interpretability'",
  "Get another player to hand over their unlocked phone and change their wallpaper"
];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickNextTask(
  pool: readonly string[],
  usedTasks: Iterable<string>,
  currentTask?: string | null
): string {
  const used = new Set(usedTasks);
  const unused = pool.filter((t) => !used.has(t));
  if (unused.length > 0) return pickRandom(unused);

  const notCurrent = currentTask
    ? pool.filter((t) => t !== currentTask)
    : pool;
  if (notCurrent.length > 0) return pickRandom(notCurrent);

  return pickRandom(pool);
}

export function pickNextSideTask(
  usedTasks: Iterable<string>,
  currentTask?: string | null
): string {
  return pickNextTask(sideTasks, usedTasks, currentTask);
}

export function pickNextMainTask(
  usedTasks: Iterable<string>,
  currentTask?: string | null
): string {
  return pickNextTask(mainTasks, usedTasks, currentTask);
}
