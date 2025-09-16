import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

dotenv.config();
const app = express();
app.use(express.json());

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname));

// ---- Helper to call Hugging Face model ----
async function callHuggingFace(prompt) {
  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/google/gemma-2-2b-it",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    const data = await res.json();
    return data[0]?.generated_text || "";
  } catch (err) {
    console.error("❌ Error calling Hugging Face:", err);
    return "";
  }
}

// ---- API: Generate Questions ----
app.post("/api/questions", async (req, res) => {
  const { role, difficulty, count } = req.body;
  const prompt = `
Generate ${count || 5} multiple-choice questions for role "${role}" and difficulty "${difficulty}".
Return ONLY a JSON array of questions:
[
  { "title": "Question text", "options": ["A", "B", "C", "D"], "correct": 0 }
]
No extra text.
`;
  const text = await callHuggingFace(prompt);
  let questions = [];
  try { questions = JSON.parse(text); } catch { questions = []; }
  res.json({ questions });
});

// ---- API: Explanation ----
app.post("/api/explanation", async (req, res) => {
  const { question, answer } = req.body;
  const prompt = `Explain why "${answer}" is correct (or incorrect) for: ${question}`;
  const explanation = await callHuggingFace(prompt);
  res.json({ explanation });
});

// ---- API: Career Recommendation ----
app.post("/api/recommendation", async (req, res) => {
  const { score, role, difficulty } = req.body;
  const prompt = `
The user scored ${score} in an AI/DS assessment (role: ${role}, difficulty: ${difficulty}).
Suggest one AI career path in 1-2 sentences.
`;
  const recommendation = await callHuggingFace(prompt);
  res.json({ recommendation });
});

// ---- Start Server ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
