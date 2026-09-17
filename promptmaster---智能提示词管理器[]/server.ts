import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import cors from "cors";
import bodyParser from "body-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("prompts.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS prompts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    variables TEXT,
    authorId TEXT NOT NULL,
    isFavorite INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json());

  // API Routes
  app.get("/api/prompts", (req, res) => {
    const { authorId } = req.query;
    if (!authorId) return res.status(400).json({ error: "authorId is required" });
    
    const stmt = db.prepare("SELECT * FROM prompts WHERE authorId = ? ORDER BY createdAt DESC");
    const rows = stmt.all(authorId);
    
    // Parse JSON strings
    const prompts = rows.map((row: any) => ({
      ...row,
      tags: JSON.parse(row.tags || "[]"),
      variables: JSON.parse(row.variables || "[]"),
      isFavorite: !!row.isFavorite
    }));
    
    res.json(prompts);
  });

  app.post("/api/prompts", (req, res) => {
    const { id, title, content, tags, variables, authorId, isFavorite } = req.body;
    const stmt = db.prepare(`
      INSERT INTO prompts (id, title, content, tags, variables, authorId, isFavorite)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, title, content, JSON.stringify(tags || []), JSON.stringify(variables || []), authorId, isFavorite ? 1 : 0);
    res.json({ success: true });
  });

  app.put("/api/prompts/:id", (req, res) => {
    const { id } = req.params;
    const { title, content, tags, variables, isFavorite } = req.body;
    
    const stmt = db.prepare(`
      UPDATE prompts 
      SET title = ?, content = ?, tags = ?, variables = ?, isFavorite = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(title, content, JSON.stringify(tags || []), JSON.stringify(variables || []), isFavorite ? 1 : 0, id);
    res.json({ success: true });
  });

  app.delete("/api/prompts/:id", (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare("DELETE FROM prompts WHERE id = ?");
    stmt.run(id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
