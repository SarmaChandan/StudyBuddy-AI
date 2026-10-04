const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");


// ========================================
// CREATE GEMINI CLIENT
// ========================================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ========================================
// CREATE EXPRESS APP
// ========================================

const app = express();


// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());

app.use(express.json());


// ========================================
// TEST ROUTE
// ========================================

app.get("/", (req, res) => {

    res.json({
        message: "StudyBuddy AI backend is running! 🚀"
    });

});


// ========================================
// AI CHAT API
// ========================================

app.post("/api/chat", async (req, res) => {

    try {

        const {
            message,
            subject,
            mode
        } = req.body;


        console.log("User message:", message);
        console.log("Subject:", subject);
        console.log("Mode:", mode);


        // ========================================
        // STUDYBUDDY INSTRUCTIONS
        // ========================================

        const prompt = `
You are StudyBuddy AI, a friendly academic peer assistant.

Your job is to help students understand concepts,
prepare for exams, practice coding, and learn effectively.

Student subject:
${subject}

Learning mode:
${mode}

Follow the selected learning mode.

If the mode is "classmate":
Explain like a helpful classmate using simple language
and examples.

If the mode is "teacher":
Give a structured explanation with definitions,
examples, and important points.

If the mode is "exam":
Give an exam-oriented answer with headings,
definitions, key points, examples, and conclusion.

If the mode is "coding":
Act as a coding mentor. Explain the logic and
provide understandable code examples.

If the mode is "beginner":
Assume the student has very little prior knowledge
and explain everything step-by-step.

Keep the answer clear and useful.
Do not make the response unnecessarily long.

Student's question:
${message}
`;


        // ========================================
        // STREAM GEMINI RESPONSE
        // ========================================

        const responseStream =
            await ai.models.generateContentStream({

                model: "gemini-3.6-flash",

                contents: prompt

            });


        // ========================================
        // RESPONSE HEADERS
        // ========================================

        res.setHeader(
            "Content-Type",
            "text/plain; charset=utf-8"
        );


        // ========================================
        // SEND STREAM CHUNKS
        // ========================================

        for await (const chunk of responseStream) {

            const text = chunk.text;

            if (text) {

                res.write(text);

            }

        }


        // ========================================
        // FINISH RESPONSE
        // ========================================

        res.end();

    } catch (error) {

        console.error(
            "Gemini API Error:",
            error
        );

        if (!res.headersSent) {

            res.status(500).json({

                success: false,

                reply:
                    "Sorry, I couldn't generate a response right now."

            });

        } else {

            res.end();

        }

    }

});


// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `StudyBuddy backend running on http://localhost:${PORT}`
    );

});