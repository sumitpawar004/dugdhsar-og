import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { D1Database, D1PreparedStatement, D1Result } from '../../../server/types';

function toSqliteValue(v: unknown): string | number | Uint8Array | null {
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number' || typeof v === 'string' || v instanceof Uint8Array) return v;
  return String(v);
}

function isReadQuery(sql: string): boolean {
  const trimmed = sql.trimStart().toUpperCase();
  return (
    trimmed.startsWith('SELECT') ||
    trimmed.startsWith('WITH') ||
    trimmed.startsWith('PRAGMA') ||
    trimmed.startsWith('EXPLAIN')
  );
}

class SqliteD1PreparedStatement implements D1PreparedStatement {
  private readonly sqlite: DatabaseSync;
  public readonly query: string;
  public readonly boundValues: Array<string | number | Uint8Array | null>;

  constructor(
    sqlite: DatabaseSync,
    query: string,
    boundValues: Array<string | number | Uint8Array | null> = []
  ) {
    this.sqlite = sqlite;
    this.query = query;
    this.boundValues = boundValues;
  }

  bind(...values: unknown[]): D1PreparedStatement {
    return new SqliteD1PreparedStatement(
      this.sqlite,
      this.query,
      values.map((v) => toSqliteValue(v))
    );
  }

  async first<T = Record<string, unknown>>(colName?: string): Promise<T | null> {
    const stmt = this.sqlite.prepare(this.query);
    const row = stmt.get(...this.boundValues) as Record<string, unknown> | undefined;
    if (!row) return null;
    if (colName) {
      return (row[colName] as T) ?? null;
    }
    return { ...row } as T;
  }

  async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    const stmt = this.sqlite.prepare(this.query);
    const rows = stmt.all(...this.boundValues) as Array<Record<string, unknown>>;
    return {
      results: rows.map((r) => ({ ...r })) as T[],
      success: true,
      meta: { changes: 0 },
    };
  }

  async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    const stmt = this.sqlite.prepare(this.query);
    if (isReadQuery(this.query)) {
      const rows = stmt.all(...this.boundValues) as Array<Record<string, unknown>>;
      return {
        results: rows.map((r) => ({ ...r })) as T[],
        success: true,
        meta: { changes: 0 },
      };
    }
    const info = stmt.run(...this.boundValues);
    return {
      results: [] as T[],
      success: true,
      meta: {
        changed_db: Number(info.changes) > 0,
        changes: Number(info.changes),
        last_row_id: Number(info.lastInsertRowid),
      },
    };
  }

  async raw<T = unknown[]>(): Promise<T[]> {
    const stmt = this.sqlite.prepare(this.query);
    const rows = stmt.all(...this.boundValues) as Array<Record<string, unknown>>;
    return rows.map((r) => Object.values(r)) as T[];
  }
}

export class LocalTestD1Database implements D1Database {
  public readonly sqlite: DatabaseSync;

  constructor(sqlite: DatabaseSync) {
    this.sqlite = sqlite;
  }

  prepare(query: string): D1PreparedStatement {
    return new SqliteD1PreparedStatement(this.sqlite, query);
  }

  async batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    const results: D1Result<T>[] = [];
    this.sqlite.exec('BEGIN');
    try {
      for (const s of statements) {
        const ps = s as SqliteD1PreparedStatement;
        const res = isReadQuery(ps.query) ? await ps.all<T>() : await ps.run<T>();
        results.push(res);
      }
      this.sqlite.exec('COMMIT');
      return results;
    } catch (err) {
      try {
        this.sqlite.exec('ROLLBACK');
      } catch {
        // Ignore rollback failure if transaction already aborted
      }
      throw err;
    }
  }

  async exec(query: string): Promise<{ count: number; duration: number }> {
    const start = Date.now();
    this.sqlite.exec(query);
    return { count: 1, duration: Date.now() - start };
  }

  close(): void {
    this.sqlite.close();
  }
}

/**
 * Creates a fresh in-memory SQLite database implementing Cloudflare D1Database,
 * pre-loaded with the real migrations/0001_init.sql and migrations/0002_seed_products.sql.
 */
export function createTestD1(options: { seed?: boolean } = {}): LocalTestD1Database {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');

  const root = process.cwd();
  const initSql = fs.readFileSync(path.join(root, 'migrations/0001_init.sql'), 'utf8');
  sqlite.exec(initSql);

  if (options.seed !== false) {
    const seedSql = fs.readFileSync(path.join(root, 'migrations/0002_seed_products.sql'), 'utf8');
    sqlite.exec(seedSql);
  }

  return new LocalTestD1Database(sqlite);
}
