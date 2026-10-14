import { getDatabase } from '@netlify/database';
import { db, type DatabaseSchema } from './db';

export async function withNetlifyState<T>(mutates: boolean, operation: () => Promise<T>): Promise<T> {
  const database = getDatabase();
  const client = await database.pool.connect();

  try {
    await client.query(
      `INSERT INTO ultra_app_state (id, version, data)
       VALUES (1, 1, $1::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [JSON.stringify(db.exportData())]
    );

    await client.query('BEGIN');
    const query = mutates
      ? 'SELECT data FROM ultra_app_state WHERE id = 1 FOR UPDATE'
      : 'SELECT data FROM ultra_app_state WHERE id = 1';
    const result = await client.query(query);
    db.replaceData(result.rows[0].data as DatabaseSchema);

    const response = await operation();

    if (mutates) {
      await client.query(
        'UPDATE ultra_app_state SET data = $1::jsonb, version = version + 1, updated_at = NOW() WHERE id = 1',
        [JSON.stringify(db.exportData())]
      );
    }
    await client.query('COMMIT');
    return response;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
