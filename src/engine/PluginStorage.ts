// ─────────────────────────────────────────────────────────────────────────────
// Plugin Storage Adapter
//
// Provides a storage interface for plugins, wrapping the modular database layer.
// Plugins should use this.engine.storage instead of importing database directly.
// ─────────────────────────────────────────────────────────────────────────────

import * as db from '../lib/db';

export interface StorageAdapter {
  table: string;
  userScoped: boolean;
}

export class PluginStorage {
  private adapters = new Map<string, StorageAdapter>();

  /**
   * Register a table adapter for a plugin.
   * This tracks which tables each plugin uses for debugging and documentation.
   */
  registerTable(pluginId: string, adapter: StorageAdapter): void {
    this.adapters.set(pluginId, adapter);
  }

  /**
   * Get the adapter configuration for a plugin.
   */
  getAdapter(pluginId: string): StorageAdapter | undefined {
    return this.adapters.get(pluginId);
  }

  /**
   * Get all registered adapters (for debugging).
   */
  getAllAdapters(): Map<string, StorageAdapter> {
    return new Map(this.adapters);
  }

  /**
   * Load a single record from a table.
   */
  async load<T = unknown>(
    table: string,
    filters: Record<string, unknown>,
    select = '*'
  ): Promise<{ data: T | null; error: string | null }> {
    return db.loadOne<T>(table, filters, select);
  }

  /**
   * Load multiple records from a table.
   */
  async loadMany<T = unknown>(
    table: string,
    filters: Record<string, unknown>,
    select = '*',
    options?: {
      orderBy?: string;
      ascending?: boolean;
      limit?: number;
    }
  ): Promise<{ data: T[]; error: string | null }> {
    return db.loadMany<T>(table, filters, select, options);
  }

  /**
   * Upsert (insert or update on conflict) a record.
   */
  async save(
    table: string,
    data: Record<string, unknown>,
    conflictKey?: string
  ): Promise<{ error: string | null }> {
    return db.upsert(table, data, conflictKey);
  }

  /**
   * Insert a new record.
   */
  async insert<T = unknown>(
    table: string,
    data: Record<string, unknown>,
    select?: string
  ): Promise<{ data: T | null; error: string | null }> {
    return db.insert<T>(table, data, select);
  }

  /**
   * Update existing records.
   */
  async update(
    table: string,
    data: Record<string, unknown>,
    filters: Record<string, unknown>
  ): Promise<{ error: string | null }> {
    return db.update(table, data, filters);
  }

  /**
   * Delete records matching the filters.
   */
  async remove(
    table: string,
    filters: Record<string, unknown>
  ): Promise<{ error: string | null }> {
    return db.remove(table, filters);
  }
}
