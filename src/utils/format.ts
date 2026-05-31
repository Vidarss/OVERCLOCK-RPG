/**
 * Format large numbers with abbreviated suffixes (K, M, B, T, Q)
 * Limits decimal places to keep numbers clean and readable
 */
export function formatNumber(n: number): string {
  // Handle edge cases
  if (!isFinite(n)) return 'MAX';
  if (isNaN(n)) return '0';
  if (n < 0) return '-' + formatNumber(-n);
  
  if (n >= 1_000_000_000_000_000) {
    const val = n / 1_000_000_000_000_000;
    return val >= 100 ? `${Math.floor(val)}Q` : `${val.toFixed(val >= 10 ? 0 : 1)}Q`;
  }
  if (n >= 1_000_000_000_000) {
    const val = n / 1_000_000_000_000;
    return val >= 100 ? `${Math.floor(val)}T` : `${val.toFixed(val >= 10 ? 0 : 1)}T`;
  }
  if (n >= 1_000_000_000) {
    const val = n / 1_000_000_000;
    return val >= 100 ? `${Math.floor(val)}B` : `${val.toFixed(val >= 10 ? 0 : 1)}B`;
  }
  if (n >= 1_000_000) {
    const val = n / 1_000_000;
    return val >= 100 ? `${Math.floor(val)}M` : `${val.toFixed(val >= 10 ? 0 : 1)}M`;
  }
  if (n >= 1_000) {
    const val = n / 1_000;
    return val >= 100 ? `${Math.floor(val)}K` : `${val.toFixed(val >= 10 ? 0 : 1)}K`;
  }
  
  // For small numbers, show integers or limit decimals
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2);
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
