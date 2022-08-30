// app.js
import express, { query } from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import axios from "axios";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";
const __dirname = path.resolve();

const app = express();

app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use(express.static("public"));

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
};

app.get("/uploadFiles", async (req, res) => {
  const [imgSrcs] = await pool.query(
    `
    SELECT *
    FROM img_table
    `
  );
  res.json(imgSrcs);
});

app.post("/upload", async (req, res) => {
  let uploadFile = req.files.img;
  const fileName = req.files.img.name;
  uploadFile.mv(`${__dirname}/public/files/${fileName}`, async (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    const imgSrc = `http://localhost:4000/files/${fileName}`;
    await pool.query(
      `
      INSERT INTO img_table (imgSrc)
      VALUES (?);
      `,
      [imgSrc]
    );

    res.send("등록됨");
  });
});

app.post("/login", async (req, res) => {
  const { user_id, password } = req.body;
  console.log(req.body);

  const [[user]] = await pool.query(
    `
  SELECT *
  FROM \`user\`
  where user_id = ?
  `,
    [user_id]
  );

  console.log("user", user);
  if (!user) {
    return res
      .status(401)
      .json({ authenticated: false, msg: "일치하는 회원이 없습니다." });
  }
  if (user.password != password) {
    return res
      .status(401)
      .json({ authenticated: false, msg: "비밀번호가 일치하지 않습니다." });
  } else {
    return res.status(200).json({ authenticated: true, msg: "로그인됨" });
  }
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
});

app.get("/todos", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM todo ORDER BY id DESC");
  //getData()
  res.json(rows);
});

app.post("/todos", async (req, res) => {
  const {
    body: { text },
  } = req;
  await pool.query(
    `
    INSERT INTO todo
    SET reg_date = NOW(),
    perform_date = '2022-08-09 12:12:12',
    checked = 0,
    text = ?
    `,
    [text]
  );
  const [updatedTodos] = await pool.query(
    `
    SELECT *
    FROM todo
    ORDER BY id DESC
    `
  );

  res.json(updatedTodos);
});

app.get("/todos/:id/", async (req, res) => {
  //const id = req.params.id;
  const { id } = req.params;

  const [[todo]] = await pool.query(
    `
  SELECT *
  FROM todo
  WHERE id = ?
  `,
    [id]
  );
  if (!todo) {
    res.status(404).json({
      msg: "not found",
    });
    return;
  }
  res.json(todo);
});

app.patch("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { perform_date, text } = req.body;

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

  if (!text) {
    res.status(400).json({
      msg: "text required",
    });
    return;
  }

  const [rs] = await pool.query(
    `
    UPDATE todo
    SET perform_date = ?,
    text = ?
    WHERE id = ?
    `,
    [perform_date, text, id]
  );

  const [updatedTodos] = await pool.query(
    `
    SELECT *
    FROM todo
    ORDER BY id DESC
    `
  );
  res.json(updatedTodos);
});

app.patch("/todos/check/:id", async (req, res) => {
  const { id } = req.params;
  const [[rows]] = await pool.query(
    `
    SELECT *
  FROM todo where id = ?
  `,
    [id]
  );
  if (!rows) {
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

    [!rows.checked, id]
  );
  const [updatedTodos] = await pool.query(
    `
    SELECT *
    FROM todo
    ORDER BY id DESC
    `
  );
  res.json(updatedTodos);
});

app.patch("/todos/swap/:id", async (req, res) => {
  const { id } = req.params;
  const { targetId } = req.body;
  if (!id) {
    res.status(400).json({
      msg: "id required",
    });
    return;
  }
  if (!targetId) {
    res.status(400).json({
      msg: "id targetId",
    });
    return;
  }

  await pool.query(
    `
  UPDATE todo a
  INNER JOIN todo b ON a.id != b.id
   SET a.reg_date = b.reg_date,
       a.perform_date = b.perform_date,
       a.checked = b.checked,
       a.text = b.text
  WHERE a.id IN (? , ?) AND b.id IN (? , ?)
  `,
    [targetId, id, id, targetId]
  );
  const [updatedTodos] = await pool.query(
    `
    SELECT *
    FROM todo
    ORDER BY id DESC
    `
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
