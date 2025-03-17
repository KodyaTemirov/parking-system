import db from "@/db/database.js";

const registerSession = (req, res) => {
  const { number, plateImage, fullImage, eventName, tariffType, paymentMethod } = req.body;

  console.log(req.body);

  const stmt = db.prepare(`
    INSERT INTO sessions
      (plateNumber, plateImage, fullImage, startTime, endTime, event, tariffType, duration, cost, paymentMethod)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    number,
    plateImage || null,
    fullImage || null,
    new Date().toISOString(), // Текущее время для startTime
    null,
    eventName,
    tariffType,
    null,
    null,
    paymentMethod
  );

  const insertedData = db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(result.lastInsertRowid);
  console.log(insertedData);

  res.status(201).send(insertedData);
};

const getSessions = (req, res) => {
  const data = db.prepare("SELECT * FROM sessions ORDER BY startTime DESC").all();

  res.status(200).send(data);
};

export { registerSession, getSessions };
