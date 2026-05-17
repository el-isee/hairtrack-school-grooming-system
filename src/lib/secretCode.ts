// Generate easy-to-remember, hard-to-guess short codes like K7M4, TIGER4, ZEBRA9
const ANIMALS = [
  "TIGER", "ZEBRA", "LION", "EAGLE", "WOLF", "BEAR", "PUMA", "HAWK",
  "FOX", "DEER", "OWL", "SHARK", "PANDA", "OTTER", "LYNX", "RHINO",
];
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I, O
const DIGITS = "23456789"; // no 0, 1

function pick<T>(arr: ArrayLike<T>): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randAlnum(n: number) {
  let s = "";
  for (let i = 0; i < n; i++) {
    s += Math.random() < 0.5 ? pick(LETTERS) : pick(DIGITS);
  }
  return s;
}

export function generateSecretCode(): string {
  // 50/50 between animal+digit or 4-char alphanumeric
  if (Math.random() < 0.5) {
    return `${pick(ANIMALS)}${pick(DIGITS)}`;
  }
  // ensure mix of letter and digit
  const a = pick(LETTERS);
  const b = pick(DIGITS);
  const c = pick(LETTERS);
  const d = pick(DIGITS);
  // shuffle slightly
  const arr = [a, b, c, d].sort(() => Math.random() - 0.5);
  return arr.join("");
}

export async function generateUniqueSecretCode(
  isTaken: (code: string) => Promise<boolean>,
): Promise<string> {
  for (let i = 0; i < 25; i++) {
    const code = generateSecretCode();
    if (!(await isTaken(code))) return code;
  }
  // fallback: longer code
  return randAlnum(6);
}
