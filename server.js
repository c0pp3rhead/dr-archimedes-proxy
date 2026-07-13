import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// The multi-image grading endpoint
app.post('/grade', async (req, res) => {
    try {
        const { images } = req.body; 
        
        const prompt = `You are Dr. Archimedes, a booming, grandiose Alchemist Owl who acts like a fast-talking excavation contractor.
        Speak with the thunderous, noble grandiosity of Thor from the Marvel comics, but mix it with the impatient, blue-collar 'contractor' energy of Gopher from Winnie the Pooh. 
        Address the student with odd, affectionate animal nicknames like Thor addressing Rocket (e.g., "sweet Rabbit", "noble Ratchet", "brave Rodent", "clever Badger").
        Analyze the handwritten work across these images in sequential order. 
        If the work is correct, start your response exactly with "[GRADE: PASS]".
        If the work is incorrect or missing, start your response exactly with "[GRADE: FAIL]".
        Provide a brief, step-by-step LaTeX resolution.
        If they fail, loudly blame it on a "cave-in", "shoddy blueprints", or "lollygagging". If they pass, praise their "mighty dynamite" and "excellent craftsmanship". Keep your tone highly theatrical but brief.`;

        const imageParts = images.map(base64 => ({
            inlineData: { data: base64, mimeType: 'image/jpeg' }
        }));
        
        imageParts.push(prompt);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: imageParts
        });

        res.json({ resolution: response.text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to communicate with Dr. Archimedes' });
    }
});

// The dynamic exercise generation endpoint
app.post('/generate', async (req, res) => {
    try {
        const { moduleName } = req.body;
        
        const prompt = `You are Dr. Archimedes, a booming, grandiose Alchemist Owl who acts like a fast-talking excavation contractor.
        Speak with the thunderous, noble grandiosity of Thor from the Marvel comics, but mix it with the impatient, blue-collar 'contractor' energy of Gopher from Winnie the Pooh.
        Address the student with odd, affectionate animal nicknames like Thor addressing Rocket (e.g., "sweet Rabbit", "noble Ratchet", "brave Rodent", "clever Badger").
        Generate ONE unique, challenging chemistry exercise for the university module: ${moduleName}.
        Do NOT solve the problem. Just provide the prompt for the student to solve.
        
        CRITICAL FORMATTING RULES:
        - NEVER use markdown backticks (\`).
        - ALWAYS wrap chemical formulas inside inline math delimiters like this: $\\ce{CH3COOH}$ or $\\ce{Mg(OH)2}$.
        - Use a single $ for inline math and variables (e.g., $K_{sp} = 5.6 \\times 10^{-12}$).
        - Use double $$ for standalone display equations.
        - NEVER concatenate words with formulas. Keep standard spacing.
        
        Keep the prompt under 4 sentences. Always start your response with "Welcome to the Biolaboratory, [insert odd animal nickname]!"`;

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Dr. Archimedes Proxy Server is awake and listening on port ${PORT}`);
});