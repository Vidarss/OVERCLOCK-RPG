/**
 * Convert number to letter suffix (A, B, C... Z, AA, AB, AC...)
 * A = thousands, B = millions, C = billions, etc.
 */
function getLetterSuffix(power: number): string {
  if (power < 0) return '';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  if (power < 26) return letters[power];
  
  // For power >= 26 (AA, AB, AC, etc.)
  const firstLetter = letters[Math.floor(power / 26) - 1];
  const secondLetter = letters[power % 26];
  return firstLetter + secondLetter;
}

/**
 * Format large numbers with alphabet suffixes (A, B, C, ... Z, AA, AB, AC...)
 * A = 1K, B = 1M, C = 1B, D = 1T, etc.
 */
export function formatNumber(n: number): string {
  // Handle edge cases
  if (!isFinite(n)) return 'MAX';
  if (isNaN(n)) return '0';
  if (n < 0) return '-' + formatNumber(-n);
  if (n < 1_000) {
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2);
  }

  // Find the appropriate power of 1000
  let power = 0;
  let divisor = 1;
  while (n >= divisor * 1_000 && power < 50) {
    divisor *= 1_000;
    power++;
  }

  const val = n / divisor;
  const suffix = getLetterSuffix(power - 1);
  
  // Format with appropriate decimals
  if (val >= 100) return `${Math.floor(val)}${suffix}`;
  if (val >= 10) return `${val.toFixed(0)}${suffix}`;
  return `${val.toFixed(1)}${suffix}`;
}

/**
 * Format a number as a percentage
 */
export function formatPercent(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

/**
 * Format time in seconds to a readable string (e.g., "1h 30m", "45s")
 */
export function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
