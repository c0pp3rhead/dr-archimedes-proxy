import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// The existing grading endpoint
app.post('/grade', async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        
        const prompt = `You are Dr. Archimedes, a strict but brilliant Alchemist owl grading university chemistry coursework. 
        Analyze the handwritten work in this image. 
        If the work is correct, start your response exactly with "[GRADE: PASS]".
        If the work is incorrect or missing, start your response exactly with "[GRADE: FAIL]".
        Provide a brief, step-by-step LaTeX resolution to explain why.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
                prompt
            ]
        });

        res.json({ resolution: response.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to communicate with Dr. Archimedes' });
    }
});

// NEW: The dynamic exercise generation endpoint
app.post('/generate', async (req, res) => {
    try {
        const { moduleName } = req.body;
        
        const prompt = `You are Dr. Archimedes, a strict but brilliant Alchemist owl and Chemistry professor.
        Generate ONE unique, challenging chemistry exercise for the university module: ${moduleName}.
        Do NOT solve the problem. Just provide the prompt for the student to solve.
        
        CRITICAL FORMATTING RULES:
        - NEVER use markdown backticks (\`) for math or text.
        - ALWAYS use \\( and \\) for inline math (e.g., \\(\\ce{H2O}\\) or \\( \\Delta H^{\\circ} \\)).
        - ALWAYS use $$ and $$ for display math (e.g., $$\\ce{C4H10 + O2 -> CO2 + H2O}$$).
        - Ensure all units are properly formatted outside of the math blocks or using standard text spacing.
        
        Keep the prompt under 3 sentences. Always start your response with "Welcome to the Biolaboratory!"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        res.json({ exercise: response.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate exercise' });
    }
});