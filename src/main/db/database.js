import Database from "better-sqlite3";
import { app } from "electron";
import path from "path";

const isDev = !app.isPackaged;

const dbPath = isDev
  ? path.join(process.cwd(), "data.db") // В корне проекта в dev режиме
  : path.join(app.getPath("userData"), "data.db"); // В директории Electron в проде

// Подключаем базу
const db = new Database(dbPath);

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS cameras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    login TEXT,
    ip TEXT UNIQUE,
    password TEXT,
    operatorId INTEGER,
    type TEXT
  );
  `
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS operators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  );
  `
).run();

// Создаем таблицу, если её нет
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plateNumber TEXT,
    inputPlateImage TEXT,
    inputFullImage TEXT,
    outputPlateImage TEXT,
    outputFullImage TEXT,
    startTime TEXT,
    endTime TEXT,
    tariffType INTEGER,
    duration INTEGER,
    inputCost REAL,
    outputCost REAL,
    inputPaymentMethod INTEGER,
    outputPaymentMethod INTEGER,
    isSync INTEGER DEFAULT 0,
    cameraIp TEXT
  );
`
).run();

console.log(`✅ База данных подключена: ${dbPath}`);

export default db;
