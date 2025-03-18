import db from "@/db/database.js";
import { getIO } from "../../utils/socket.js";

const GETOPERATORS = async (req, res) => {
  try {
    const data = db.prepare("SELECT * FROM operators ORDER BY id ASC").all();

    res.status(200).send(data);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const POSTOPERATORS = async (req, res) => {
  try {
    const { name } = req.body;

    const stmt = db.prepare(`
    INSERT INTO operators
      (name)
    VALUES (?)
  `);

    const result = stmt.run(name);

    const insertedData = db
      .prepare("SELECT * FROM operators WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(200).send(insertedData);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const PUTOPERATORS = async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;

    const data = db
      .prepare(
        `UPDATE operators
         SET name = ?
         WHERE id = ?;`
      )
      .run(name, id);

    const updatedData = db.prepare("SELECT * FROM operators WHERE id = ?").get(id);

    res.status(200).send(updatedData);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const DELETEOPERATORS = async (req, res) => {
  try {
    const { id } = req.params;

    const data = db
      .prepare(
        `DELETE FROM operators
WHERE id = ?;`
      )
      .run(id);

    res.status(200).send({
      message: "Deleted successfully",
    });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

export { GETOPERATORS, POSTOPERATORS, PUTOPERATORS, DELETEOPERATORS };
