import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse incoming JSON payloads
app.use(cors());
app.use(express.json({ limit: '50mb' })); // We need a high limit for Base64 image strings

// Initialize the Gemini SDK
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

app.post('/grade', async (req, res) => {
    try {
        let { imageBase64 } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ error: "No image provided." });
        }

        console.log("Hoot! Dr. Archimedes received a new submission. Analyzing...");

        // SANITIZATION: Ensure it is just the raw Base64 string
        if (imageBase64.includes("base64,")) {
            imageBase64 = imageBase64.split("base64,")[1];
        }

        const systemPrompt = `You are Dr. Archimedes, the Alchemist Owl. You reside in an overgrown, ancient biolaboratory. You are a strict but encouraging mentor. The user will upload an image of handwritten chemistry work. 
        CURRENT MODULE: Level 0 - Pre-Lab (Stoichiometry, Aqueous Reactions, Molarity).
        YOUR TASK:
        1. Analyze the handwritten user image.
        2. Verify the math, balanced chemical equations, and units.
        3. Output a STRICT grading token on the very first line: Either [GRADE: PASS] or [GRADE: FAIL].
        4. Provide a step-by-step resolution written in the persona of Dr. Archimedes.
        5. You MUST use LaTeX wrapped in $$ with the \\ce{} command for all chemical equations so the frontend mhchem renderer can parse them.`;

        // NEW SDK FORMATTING: The part object must be structured exactly like this
        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: "image/jpeg"
            }
        };

        // NEW SDK FORMATTING: System instructions are now passed separately
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [imagePart, "Analyze this image according to your instructions."],
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.2 // Keep the owl focused and analytical
            }
        });

        const aiText = response.text;
        
        console.log("Analysis complete. Sending resolution back to Android.");
        res.json({ resolution: aiText });

    } catch (error) {
        console.error("The crucible shattered! Error details:", error.message || error);
        res.status(500).json({ error: "Failed to process image." });
    }
});

app.listen(port, () => {
    console.log(`Dr. Archimedes Proxy Server is awake and listening on port ${port}`);
});