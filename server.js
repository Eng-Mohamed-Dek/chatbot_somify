import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

import { SOMIFY_SYSTEM_INSTRUCTION } from "./prompts/somify.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check API key
if (!process.env.GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is missing from .env");
  process.exit(1);
}

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Somify chatbot server is running"
  });
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    // Validate message
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid message."
      });
    }

    const cleanMessage = message.trim();

    if (!cleanMessage) {
      return res.status(400).json({
        success: false,
        error: "Message cannot be empty."
      });
    }

    // Limit history to prevent unnecessarily huge requests
    const safeHistory = Array.isArray(history)
      ? history.slice(-20)
      : [];

    // Convert frontend history into Gemini format
    const geminiHistory = safeHistory
      .filter(
        (item) =>
          item &&
          (item.role === "user" || item.role === "model") &&
          typeof item.text === "string" &&
          item.text.trim()
      )
      .map((item) => ({
        role: item.role,
        parts: [
          {
            text: item.text
          }
        ]
      }));

    // Create Gemini chat
    const chat = ai.chats.create({
      model: "gemini-3.6-flash",
      history: geminiHistory,
      config: {
        systemInstruction: SOMIFY_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    });

    // Send message to Gemini
    const response = await chat.sendMessage({
      message: cleanMessage
    });

    const reply = response.text || "Sorry, I couldn't generate a response.";

    return res.json({
      success: true,
      reply
    });
  } catch (error) {
    console.error("Gemini Error:", error);

    return res.status(500).json({
      success: false,
      error: "Something went wrong while processing your message."
    });
  }
});

// Catch-all route for Express 5
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║        SOMIFY AI CHATBOT                 ║
╠══════════════════════════════════════════╣
║ Server: http://localhost:${PORT}           ║
║ Status: Running                          ║
╚══════════════════════════════════════════╝
  `);
});
