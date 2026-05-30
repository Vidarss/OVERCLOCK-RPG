// ─────────────────────────────────────────────────────────────────────────────
// Database Query Utilities
//
// Reusable query functions with error handling, retries, and logging.
// All database operations should go through these utilities.
// ─────────────────────────────────────────────────────────────────────────────

import { getClient } from './client';
import { getCurrentConfig } from './client';

export interface QueryResult<T> {
  data: T | null;
  error: string | null;
}

export interface QueryManyResult<T> {
  data: T[];
  error: string | null;
}

/**
 * Sleep utility for retry delays.
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute a query with automatic retries on failure.
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  const config = getCurrentConfig();
  const retryCount = config?.query.retryCount ?? 3;
  const retryDelay = config?.query.retryDelayMs ?? 1000;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      if (attempt < retryCount) {
        console.warn(`[DB] ${context} failed (attempt ${attempt + 1}/${retryCount + 1}), retrying...`, lastError.message);
        await sleep(retryDelay * (attempt + 1)); // Exponential backoff
      }
    }
  }
  
  throw lastError;
}

/**
 * Load a single record from a table.
 */
export async function loadOne<T = unknown>(
  table: string,
  filters: Record<string, unknown>,
  select = '*'
): Promise<QueryResult<T>> {
  try {
    const result = await withRetry(async () => {
      const client = getClient();
      let query = client.from(table).select(select);
      
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
      
      return query.maybeSingle();
    }, `loadOne(${table})`);
    
    if (result.error) {
      return { data: null, error: result.error.message };
    }
    
    return { data: result.data as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DB] loadOne(${table}) failed:`, message);
    return { data: null, error: message };
  }
}

/**
 * Load multiple records from a table.
 */
export async function loadMany<T = unknown>(
  table: string,
  filters: Record<string, unknown>,
  select = '*',
  options?: {
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
  }
): Promise<QueryManyResult<T>> {
  try {
    const result = await withRetry(async () => {
      const client = getClient();
      let query = client.from(table).select(select);
      
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
      
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? false });
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      return query;
    }, `loadMany(${table})`);
    
    if (result.error) {
      return { data: [], error: result.error.message };
    }
    
    return { data: (result.data ?? []) as T[], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DB] loadMany(${table}) failed:`, message);
    return { data: [], error: message };
  }
}

/**
 * Upsert (insert or update on conflict) a record.
 */
export async function upsert(
  table: string,
  data: Record<string, unknown>,
  conflictKey?: string
): Promise<{ error: string | null }> {
  try {
    const result = await withRetry(async () => {
      const client = getClient();
      const opts = conflictKey ? { onConflict: conflictKey } : undefined;
      return client.from(table).upsert(data, opts);
    }, `upsert(${table})`);
    
    if (result.error) {
      return { error: result.error.message };
    }
    
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DB] upsert(${table}) failed:`, message);
    return { error: message };
  }
}

/**
 * Insert a new record.
 */
export async function insert<T = unknown>(
  table: string,
  data: Record<string, unknown>,
  select?: string
): Promise<QueryResult<T>> {
  try {
    const result = await withRetry(async () => {
      const client = getClient();
      const query = client.from(table).insert(data);
      
      if (select) {
        return query.select(select).single();
      }
      
      return query;
    }, `insert(${table})`);
    
    if (result.error) {
      return { data: null, error: result.error.message };
    }
    
    return { data: (result.data as T) ?? null, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DB] insert(${table}) failed:`, message);
    return { data: null, error: message };
  }
}

/**
 * Update existing records matching the filters.
 */
export async function update(
  table: string,
  data: Record<string, unknown>,
  filters: Record<string, unknown>
): Promise<{ error: string | null }> {
  try {
    const result = await withRetry(async () => {
      const client = getClient();
      let query = client.from(table).update(data);
      
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
      
      return query;
    }, `update(${table})`);
    
    if (result.error) {
      return { error: result.error.message };
    }
    
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DB] update(${table}) failed:`, message);
    return { error: message };
  }
}

/**
 * Delete records matching the filters.
 */
export async function remove(
  table: string,
  filters: Record<string, unknown>
): Promise<{ error: string | null }> {
  try {
    const result = await withRetry(async () => {
      const client = getClient();
      let query = client.from(table).delete();
      
      for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value);
      }
      
      return query;
    }, `remove(${table})`);
    
    if (result.error) {
      return { error: result.error.message };
    }
    
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DB] remove(${table}) failed:`, message);
    return { error: message };
  }
}

/**
 * Execute a raw RPC call.
 */
export async function rpc<T = unknown>(
  functionName: string,
  params?: Record<string, unknown>
): Promise<QueryResult<T>> {
  try {
    const result = await withRetry(async () => {
      const client = getClient();
      return client.rpc(functionName, params);
    }, `rpc(${functionName})`);
    
    if (result.error) {
      return { data: null, error: result.error.message };
    }
    
    return { data: result.data as T, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[DB] rpc(${functionName}) failed:`, message);
    return { data: null, error: message };
  }
}
