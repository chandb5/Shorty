// filepath: /Users/chand/Desktop/Chand-Codes/shorty/frontend/src/lib/utils.ts
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ")
}
