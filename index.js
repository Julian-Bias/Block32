const pg = require("pg");
const express = require("express");
const app = express();

const client = new pg.Client(
  process.env.DATABASE_URL ||
    "postgres://Julian:J4365mbj@@localhost/acme_icecream_db"
);

app.use(express.json());
app.use(require("morgan")("dev"));

//get
app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = /*sql*/ `SELECT * from flavors ORDER BY created_at;`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

//get by id
app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await client.query("SELECT * FROM flavors WHERE id = $1", [
      id,
    ]);
    if (response.rows.length === 0) {
      return res.status(404).json({ error: "Flavor not found" });
    }
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//post
app.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = /*sql*/ `
          INSERT INTO flavors(name, is_favorite)
          VALUES($1, $2)
          RETURNING *
        `;

    const { name, is_favorite = false } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    const response = await client.query(SQL, [name, is_favorite]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//delete
app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = /*sql*/ `
        DELETE from flavors
        WHERE id = $1
        `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

// put
app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const { name, is_favorite } = req.body;
    const { id } = req.params;

    const SQL = /*sql*/ `
        UPDATE flavors
        SET
            name = $1,
            is_favorite = $2,
            updated_at = now()
            WHERE id = $3
            RETURNING * 
        `;
    const response = await client.query(SQL, [name, is_favorite, id]);
    if (response.rows.length === 0) {
      return res.status(404).json({ error: "Flavor not found" });
    }
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//init
const init = async () => {
  await client.connect();
  let SQL = /* sql */ `
      DROP TABLE IF EXISTS flavors;
      CREATE TABLE flavors(
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      name VARCHAR(255),
      is_favorite BOOLEAN DEFAULT FALSE
      );
    
      INSERT INTO flavors(name, is_favorite) VALUES('Cookies and Cream', true);
      INSERT INTO flavors(name, is_favorite) VALUES('Rainbow Sherbet', true);
      INSERT INTO flavors(name, is_favorite) VALUES('Chocolate', false);
      `;

  await client.query(SQL);
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};
init();
