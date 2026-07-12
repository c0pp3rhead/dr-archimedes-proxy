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
        const { imagesBase64 } = req.body; // Now expects an array from Android
        
        const prompt = `You are Dr. Archimedes, a strict but brilliant Alchemist owl grading university chemistry coursework. 
        Analyze the handwritten work across these images in sequential order. 
        If the work is correct, start your response exactly with "[GRADE: PASS]".
        If the work is incorrect or missing, start your response exactly with "[GRADE: FAIL]".
        Provide a brief, step-by-step LaTeX resolution to explain why.`;

        // Map the array of base64 strings into Gemini's expected inlineData format
        const imageParts = imagesBase64.map(base64 => ({
            inlineData: { data: base64, mimeType: 'image/jpeg' }
        }));
        
        // Append the prompt to the end of the parts array
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

// NEW: The dynamic exercise generation endpoint
app.post('/generate', async (req, res) => {
    try {
        const { moduleName } = req.body;
        
        const prompt = `You are Dr. Archimedes, a strict but brilliant Alchemist owl and Chemistry professor.
        Generate ONE unique, challenging chemistry exercise for the university module: ${moduleName}.
        Do NOT solve the problem. Just provide the prompt for the student to solve.
        
        CRITICAL FORMATTING RULES:
        - NEVER use markdown backticks (\`).
        - ALWAYS wrap chemical formulas inside inline math delimiters like this: $\\ce{CH3COOH}$ or $\\ce{Mg(OH)2}$.
        - Use a single $ for inline math and variables (e.g., $K_{sp} = 5.6 \times 10^{-12}$).
        - Use double $$ for standalone display equations.
        - NEVER concatenate words with formulas. Keep standard spacing.
        
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
// ... [your /generate block ends here]

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Dr. Archimedes Proxy Server is awake and listening on port ${PORT}`);
});