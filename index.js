require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error acquiring client", err.stack);
  }
  console.log("Connected to Neon Database successfully");
  release();
});

app.get("/v1/recipes", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const query =
      "SELECT * FROM recipes ORDER BY scraped_at DESC LIMIT $1 OFFSET $2";
    const result = await pool.query(query, [limit, offset]);

    res.json({
      success: true,
      count: result.rows.length,
      page: page,
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

app.get("/v1/recipes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const query = "SELECT * FROM recipes WHERE id = $1";
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Recipe not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

app.get("/v1/category/:name", async (req, res) => {
  try {
    const { name } = req.params;
    // Case insensitive search
    const query =
      "SELECT * FROM recipes WHERE LOWER(category) = LOWER($1) LIMIT 50";
    const result = await pool.query(query, [name]);

    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

app.get("/v1/", (req, res) => {
  res.send("Recipe API is running. Go to /recipes to see data.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
