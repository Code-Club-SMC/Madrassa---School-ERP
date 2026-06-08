const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE = "abcdefghjkmnpqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*";

export function generateSecurePassword(length = 12): string {
  const allChars = UPPERCASE + LOWERCASE + DIGITS + SYMBOLS;
  const array = new Uint32Array(length + 4);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) array[i] = Math.floor(Math.random() * 0xffffffff);
  }
  const mandatory = [
    UPPERCASE[array[0] % UPPERCASE.length],
    LOWERCASE[array[1] % LOWERCASE.length],
    DIGITS[array[2] % DIGITS.length],
    SYMBOLS[array[3] % SYMBOLS.length],
  ];
  const rest = Array.from({ length: length - 4 }, (_, i) => allChars[array[i + 4] % allChars.length]);
  const combined = [...mandatory, ...rest];
  const shuffleArr = new Uint32Array(combined.length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(shuffleArr);
  else for (let i = 0; i < shuffleArr.length; i++) shuffleArr[i] = Math.floor(Math.random() * 0xffffffff);
  for (let i = combined.length - 1; i > 0; i--) {
    const j = shuffleArr[i] % (i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.join("");
}