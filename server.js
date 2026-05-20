import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(express.json());

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname));

// ---- Gemini Setup ----
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// ---- Helper to call Gemini with retry ----
async function callGemini(prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      const isRateLimit = err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("RESOURCE_EXHAUSTED");
      if (isRateLimit && attempt < retries) {
        const delay = attempt * 5000; // 5s, 10s, 15s
        console.log(`⏳ Rate limited. Retrying in ${delay / 1000}s (attempt ${attempt}/${retries})...`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        console.error(`❌ Gemini error (attempt ${attempt}):`, err.message);
        return "";
      }
    }
  }
  return "";
}

// ---- API: Generate Questions WITH Explanations ----
app.post("/api/questions", async (req, res) => {
  const { role, difficulty, count } = req.body;
  const prompt = `
Generate exactly ${count || 10} multiple-choice questions for an AI career assessment.
Role: "${role || "Data Scientist"}"
Difficulty: "${difficulty || "intermediate"}"

IMPORTANT: Each question MUST include an "explanation" field that explains why the correct answer is right (2-3 sentences, educational).

Each question must have exactly 4 options.
Return ONLY a valid JSON array, no markdown, no code fences, no extra text:
[
  {
    "title": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Brief explanation of why Option A is correct..."
  }
]

The "correct" field is the zero-based index of the correct option.
Make questions relevant, challenging, and educational for the role and difficulty level.
`;

  const text = await callGemini(prompt);
  let questions = [];
  try {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    questions = JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse questions JSON. Raw:", text?.substring(0, 200));
    questions = [];
  }
  res.json({ questions });
});

// ---- API: Single Explanation (fallback) ----
app.post("/api/explanation", async (req, res) => {
  const { question, answer, correctAnswer } = req.body;
  const prompt = `Quiz question: "${question}"
User selected: "${answer}"
Correct answer: "${correctAnswer || 'unknown'}"

In 2-3 concise sentences, explain why the correct answer is right. Be educational and clear.`;
  const explanation = await callGemini(prompt);
  res.json({ explanation: explanation || "Explanation could not be generated at this time." });
});

// ---- API: Career Recommendation ----
app.post("/api/recommendation", async (req, res) => {
  const { score, role, difficulty } = req.body;
  const prompt = `
The user scored ${score} in an AI/DS career assessment.
Role assessed: ${role}
Difficulty: ${difficulty}

Give a personalized 2-3 sentence career recommendation based on their performance. Mention specific technologies, courses, or skills they should focus on. Be encouraging and specific.`;
  const recommendation = await callGemini(prompt);
  res.json({ recommendation: recommendation || "" });
});

// ---- Start Server ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ AI Career Path running at http://localhost:${PORT}`)
);