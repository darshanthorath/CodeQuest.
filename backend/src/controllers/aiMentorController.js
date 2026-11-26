
import OpenAI from "openai";

export async function mentorChat(req, res) {
  try {
    const {
      message,
      code = "",
      language = "JavaScript",
      mode = "explain"
    } = req.body;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "Please enter a question."
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        message: "Question is too long."
      });
    }

    if (typeof code !== "string" || code.length > 20000) {
      return res.status(400).json({
        message: "Code must be text and under 20,000 characters."
      });
    }

    const allowedModes = ["explain", "debug", "improve", "hint", "chat"];

    if (!allowedModes.includes(mode)) {
      return res.status(400).json({
        message: "Invalid mentor mode."
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        message: "AI Mentor is not configured."
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      instructions: `
You are CodeQuest AI Mentor, a friendly programming teacher.

Mode: ${mode}
Language: ${language}

Explain concepts simply.
Identify bugs and explain fixes.
Suggest improvements with examples.
For hints, guide students without immediately giving the full answer.
Never claim code was executed or tested unless it actually was.
`,
      input: `
Student question:
${message}

Student code:
${code || "No code provided."}
`
    });

    return res.json({
      success: true,
      reply: response.output_text
    });

  } catch (error) {
    console.error("AI Mentor error:", error.message);

    return res.status(500).json({
      message: "AI Mentor could not generate a response."
    });
  }
}
