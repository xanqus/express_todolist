// app.js
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import axios from "axios";
import path from "path";
const __dirname = path.resolve();

const app = express();

app.use(cors());
app.use(express.json());

app.set("view engine", "pug");
app.set("views", "./views");

const port = 4000;
const pool = mysql.createPool({
  host: "localhost",
  user: "sbsst",
  password: "sbs123414",
  database: "a9",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const getData = async () => {
  const data = await axios.get("http://localhost:3000/todos");
  console.log("async await", data);
};

app.get("/", (req, res) => {
  //res.sendFile(__dirname + "/views/template.html");
  res.render("template.pug", { title: "PUG : EXPRESS TEMPLATE ENGINE" });
});

app.get("/todos/:id/:contentId", async (req, res) => {
  // params 여러개 받기
  const data = {
    todos: {
      id: req.params.id,
      contentId: req.params.contentId,
    },
  };

  const {
    todos: { id, contentId },
  } = data;

  console.log("id", id);
});

app.get("/todos", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM todo ORDER BY id DESC");

  //getData();
  res.json(rows);
});

app.get("/todos/:id/", async (req, res) => {
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

app.patch("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { perform_date, content } = req.body;

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
  }

  if (!perform_date) {
    res.status(400).json({
      msg: "perform_date required",
    });
    return;
  }

  if (!content) {
    res.status(400).json({
      msg: "content required",
    });
    return;
  }

  const [rs] = await pool.query(
    `
    UPDATE todo
    SET perform_date = ?,
    content = ?
    WHERE id = ?
    `,
    [perform_date, content, id]
  );

  res.json({
    msg: `${id}번 할일이 수정되었습니다.`,
  });
});

app.patch("/todos/check/:id", async (req, res) => {
  const { id } = req.params;
  const [[todoRow]] = await pool.query(
    `
    SELECT *
    FROM todo
    WHERE id = ?
    `,
    [id]
  );
  if (!todoRow) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  await pool.query(
    `
    UPDATE todo
    SET checked = ?
    WHERE id = ?
    `,
    [!todoRow.checked, id]
  );

  const [updatedTodos] = await pool.query(
    `
  SELECT *
  FROM todo
  ORDER BY id DESC
  `,
    [id]
  );

  res.json(updatedTodos);
});

app.delete("/todos/:id", async (req, res) => {
  const { id } = req.params;

  const [[todoRow]] = await pool.query(
    `
    SELECT *
    FROM todo
    WHERE id = ?`,
    [id]
  );

  if (todoRow === undefined) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }

  const [rs] = await pool.query(
    `DELETE FROM todo
    WHERE id = ?`,
    [id]
  );
  res.json({
    msg: `${id}번 할일이 삭제되었습니다.`,
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
