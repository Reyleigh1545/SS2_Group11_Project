import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Fix __dirname cho ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📂 Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// 🌐 Route mặc định
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔥 PORT cho Heroku
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});