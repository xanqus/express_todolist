// app.js
import express, { query } from 'express'
import mysql from 'mysql2/promise'
import cors from 'cors'
import axios from 'axios'

const app = express()

app.use(cors())
app.use(express.json())

const port = 4000
const pool = mysql.createPool({
  host: 'localhost',
  user: 'sbsst',
  password: 'sbs123414',
  database: 'a9',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

const getData = async () => {
  const data = await axios.get('http://localhost:3000/todos')
}

app.get('/todos/:id/:contentId', async (req, res) => {
  // params 여러개 받기
  const data = {
    todos: {
      id: req.params.id,
      contentId: req.params.contentId,
    },
  }

  const {
    todos: { id, contentId },
  } = data
})

app.get('/todos', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM todo ORDER BY id DESC')
  //getData()
  res.json(rows)
})

app.post('/todos', async (req, res) => {
  const {
    body: { text },
  } = req
  await pool.query(
    `
  INSERT INTO todo
  SET reg_date = NOW(),
  perform_date = '2022-05-18 07:00:00',
  checked = 0,
  text = ?;
  `,
    [text]
  )
  const [[rows]] = await pool.query(`
  SELECT *
  FROM todo
  ORDER BY id
  DESC LIMIT 1
  `)
  res.json(rows)
})

app.get('/todos/:id/', async (req, res) => {
  //const id = req.params.id;
  const { id } = req.params

  const [rows] = await pool.query(
    `
  SELECT *
  FROM todo
  WHERE id = ?
  `,
    [id]
  )
  if (rows.length === 0) {
    res.status(404).json({
      msg: 'not found',
    })
    return
  }

  res.json(rows[0])
})

app.patch('/todos/:id', async (req, res) => {
  const { id } = req.params
  const { perform_date, text } = req.body

  const [rows] = await pool.query(
    `
    SELECT *
    FROM todo
    WHERE id = ?
    `,
    [id]
  )

  if (rows.length === 0) {
    res.status(404).json({
      msg: 'not found',
    })
  }

  if (!perform_date) {
    res.status(400).json({
      msg: 'perform_date required',
    })
    return
  }

  if (!text) {
    res.status(400).json({
      msg: 'text required',
    })
    return
  }

  const [rs] = await pool.query(
    `
    UPDATE todo
    SET perform_date = ?,
    text = ?
    WHERE id = ?
    `,
    [perform_date, text, id]
  )

  res.json({
    msg: `${id}번 할일이 수정되었습니다.`,
  })
})

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
  )

  if (todoRow === undefined) {
    res.status(404).json({
      msg: 'not found',
    })
    return
  }

  const [rs] = await pool.query(
    `DELETE FROM todo
    WHERE id = ?`,
    [id]
  )
  res.json({
    msg: `${id}번 할일이 삭제되었습니다.`,
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
