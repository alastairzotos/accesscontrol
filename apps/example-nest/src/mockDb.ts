import * as fs from 'fs';
import * as path from 'path';
import { PostSchema, User } from "./types";

export class MockDb {
  db = this.loadDb();

  async create(resourceType, value) {
    const created = {
      id: `${Math.round(1000 + Math.random() * 1000)}`,
      ...value as PostSchema,
    };

    this.db[resourceType as string].push(created);

    this.saveDb();

    return created;
  }

  async read(resourceType, resourceId) {
    return this.db[resourceType as string].find((item) => item.id === resourceId);
  }
  async update(resourceType, resourceId, values) {
    const index = this.db[resourceType as string].findIndex((item) => item.id === resourceId);
    
    if (index >= 0) {
      const data = this.db[resourceType as string][index];

      const updated = { ...data, ...values };

      this.db[resourceType as string][index] = updated;
      
      this.saveDb();

      return updated;
    }
  }

  async delete(resourceType, resourceId) {
    const index = this.db[resourceType as string].findIndex((item) => item.id === resourceId);

    if (index >= 0) {
      this.db[resourceType as string].splice(index, 1);
      this.saveDb();
    }
  }

  private loadDb(): Record<string, any[]> {
    const defaultDb = {
      users: [] as User[],
      posts: [] as PostSchema[]
    };

    const dbPath = path.resolve(__dirname, '..', 'mock-db');
    if (fs.existsSync(dbPath) && fs.existsSync(path.resolve(dbPath, 'db.json'))) {
      const data = fs.readFileSync(path.resolve(dbPath, 'db.json'), 'utf-8');
      return JSON.parse(data);
    }

    return defaultDb;
  }

  private saveDb() {
    const dbPath = path.resolve(__dirname, '..', 'mock-db');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath);
    }

    fs.writeFileSync(path.resolve(dbPath, 'db.json'), JSON.stringify(this.db, null, 2));
  }
}