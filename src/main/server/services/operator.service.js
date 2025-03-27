import db from "@/db/database.js";

const getOperators = async (req, res) => {
  try {
    const data = db.prepare("SELECT * FROM operators ORDER BY id ASC").all();

    res.status(200).send(data);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const postOperators = async (req, res) => {
  try {
    const stmt = db.prepare(`
   INSERT INTO operators DEFAULT VALUES
  `);

    const result = stmt.run();

    const insertedData = db
      .prepare("SELECT * FROM operators WHERE id = ?")
      .get(result.lastInsertRowid);

    const data = db
      .prepare(
        `UPDATE operators
         SET name = ?
         WHERE id = ?;`
      )
      .run(`OPERATOR-${insertedData.id}`, insertedData.id);

    const updatedInfo = db.prepare("SELECT * FROM operators WHERE id = ?").get(insertedData.id);

    res.status(200).send(updatedInfo);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const putOperators = async (req, res) => {
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

const deleteOperators = async (req, res) => {
  try {
    const { id } = req.params;

    const data = db
      .prepare(
        `DELETE FROM operators
WHERE id = ?;`
      )
      .run(id);

    db.prepare(`DELETE FROM cameras WHERE operatorId = ?`).run(id);

    res.status(200).send({
      message: "Deleted successfully",
    });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

export { getOperators, postOperators, putOperators, deleteOperators };
