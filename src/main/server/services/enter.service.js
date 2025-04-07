import db from "@/db/database.js";
import { openFetchByIp } from "../../utils/plateFunctions";

const getEnters = async (req, res) => {
  try {
    const data = db.prepare("SELECT * FROM enters ORDER BY id DESC").all();

    res.status(200).send(data);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const postEnter = async (req, res) => {
  try {
    const { cameraId, operatorId, openedAt } = req.body;

    if (!cameraId || !operatorId || !openedAt) {
      return res.status(400).send("Missing required fields");
    }

    const stmt = db.prepare(`
   INSERT INTO enters (
   cameraId,
   operatorId,
   openedAt) VALUES (?,?,?);
  `);

    const result = stmt.run(cameraId, operatorId, new Date().toISOString());

    const insertedData = db
      .prepare("SELECT * FROM operators WHERE id = ?")
      .get(result.lastInsertRowid);

    await openFetchByIp(cameraId);

    res.status(200).send(insertedData);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

export { getEnters, postEnter };
