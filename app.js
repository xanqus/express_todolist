// app.js
import express from "express";
import mysql from "mysql2/promise";

const app = express();
const port = 3000;
const pool = mysql.createPool({
  host: "localhost",
  user: "sbsst",
  password: "sbs123414",
  database: "a9",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.get("/todos", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM todo ORDER BY id DESC");
  console.log("아 어렵다.");
  res.json(rows);
});

app.get("/todos/:id", async (req, res) => {
  //const id = req.params.id;
  const { id } = req.params;

  const [rows] = await pool.query(
    `
  SELECT *
  FROM todo
  WHERE id = ?
  `,
    [id]
  );
  if (rows.length === 0) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  res.json(rows[0]);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
