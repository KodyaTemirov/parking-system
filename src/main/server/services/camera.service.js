import db from "@/db/database.js";
import { getIO } from "../../utils/socket.js";

const GETCAMERAS = async (req, res) => {
  try {
    const data = db.prepare("SELECT * FROM cameras ORDER BY id ASC").all();

    res.status(200).send(data);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const POSTCAMERAS = async (req, res) => {
  try {
    const { name, login, ip, password, operatorId, status, type } = req.body;

    const data = await fetch(`http://${ip}/GetDeviceInfo`, {
      headers: {
        Authorization: "Basic " + btoa(`${login}:${password}`),
      },
    });
    console.log(data);

    if (data.status != 200) return res.status(400).send({ message: "Camera not found" });

    const stmt = db.prepare(`
    INSERT INTO cameras
      (name, login, ip, password, operatorId, status,type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

    const result = stmt.run(name, login, ip, password, Number(operatorId), status, type);

    const insertedData = db
      .prepare("SELECT * FROM cameras WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(200).send(insertedData);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const PUTCAMERAS = async (req, res) => {
  try {
    const { name, login, ip, password, operatorId, status, type } = req.body;
    const { id } = req.params;

    const info = await fetch(`http://${ip}/GetDeviceInfo`, {
      headers: {
        Authorization: "Basic " + btoa(`${login}:${password}`),
      },
    });
    console.log(info);

    if (info.status != 200) return res.status(400).send({ message: "Camera not found" });

    const data = db
      .prepare(
        `UPDATE cameras
         SET name = ?,
         login = ?,
         ip = ?,
         password = ?,
         operatorId = ?,
         status = ?,
         type = ?
         WHERE id = ?;`
      )
      .run(name, login, ip, password, operatorId, status, type, id);

    const updatedData = db.prepare("SELECT * FROM cameras WHERE id = ?").get(id);

    res.status(200).send(updatedData);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const DELETECAMERAS = async (req, res) => {
  try {
    const { id } = req.params;

    const data = db
      .prepare(
        `DELETE FROM cameras
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

export { GETCAMERAS, POSTCAMERAS, PUTCAMERAS, DELETECAMERAS };
