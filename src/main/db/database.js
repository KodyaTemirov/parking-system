import Database from "better-sqlite3";
import { app } from "electron";
import path from "path";

const isDev = !app.isPackaged;

const dbPath = isDev
  ? path.join(process.cwd(), "data.db") // В корне проекта в dev режиме
  : path.join(app.getPath("userData"), "data.db"); // В директории Electron в проде

// Подключаем базу
const db = new Database(dbPath, { verbose: console.log });

// Создаем таблицу, если её нет
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plateNumber TEXT,
    plateImage TEXT,
    fullImage TEXT,
    startTime TEXT,
    endTime TEXT,
    event TEXT,
    tariffType INTEGER,
    duration INTEGER,
    cost REAL,
    paymentMethod INTEGER
    paymentStatus INTEGER
  )
`
).run();

console.log(`✅ База данных подключена: ${dbPath}`);

export default db;
