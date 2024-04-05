import { migrate } from 'drizzle-orm/libsql/migrator';
import { db, client } from './src/lib/db';
await migrate(db, { migrationsFolder: './drizzle' }).catch((err) => {
  client.close();
});
client.close();
