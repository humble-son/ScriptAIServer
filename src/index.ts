import express, { type Request, type Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";

import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*", // Allow only your frontend
    methods: ["POST", "GET"], // Allow specific methods
    credentials: true, // Allow cookies/headers if needed
  })
);

const port = process.env.PORT || 3090;
const apiKey = process.env.API_KEY;

app.listen(port, () => {
  console.log("listening at port " + port);
});

app.use(express.json());

app.post("/script", getScriptBreakdown);

app.post("/solve-question", solveQuestion);

async function getScriptBreakdown(req: Request, res: Response) {
  const genAI = new GoogleGenerativeAI(apiKey as string);
  const { scriptText } = req.body;

  try {
    if (!scriptText) {
      return res.status(400).json({
        status: false,
        message: "No script available",
        data: null,
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
    const prompt = `You are an expert script supervisor and assistant director. Your task is to break down the following movie script into a structured JSON object.
${scriptText}

Instructions:
1. Analyze the script above carefully.
2. Extract the following details:
   - characters: An array of unique character names found in the scene.
   - props: An array of physical objects that characters interact with or hold.
   - locations: An array of specific settings (e.g., "Alleyway", "Kitchen").
   - actions: An array of key physical movements or plot beats (e.g., "Jason runs", "Elena lights cigarette").
   - time_of_day: A single string indicating the time (e.g., "Night", "Day", "Dawn"). Defaults to "Unknown" if not specified.

3. Output Requirements:
   - Your response MUST be a valid JSON object.
   - Do NOT include markdown formatting. Just the raw JSON string.
   - Do NOT include any introductory or concluding text.

Example Output Format:
{
  "characters": ["Jason", "Elena"],
  "props": ["Briefcase", "Cigarette"],
  "locations": ["Alleyway"],
  "actions": ["Jason runs down the alley", "Elena steps out"],
  "time_of_day": "Night"
  }`;

    const result = await model.generateContent(prompt);

    const response = result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json|```/g, "").trim();

    // Parse it to ensure it's valid JSON
    const jsonData = JSON.parse(cleanedText);

    return res.status(200).json({
      status: true,
      message: "script breakdown successfully",
      data: jsonData,
    });
  } catch (error: any) {
    // console.log(error);
    res.status(500).json({
      status: false,
      message: "An error occurred",
    });
  }
}

async function solveQuestion(req: Request, res: Response) {
  const genAI = new GoogleGenerativeAI(apiKey as string);
  const { question } = req.body;

  try {
    if (!question) {
      return res.status(400).json({
        status: false,
        message: "No question available",
        data: null,
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
    const prompt = `You are "StudyBuddy," an advanced academic AI assistant specializing in all subjects. Your goal is to provide comprehensive,accurate, and structured educational content based on a student's input question ${question}.
    ### DATA FORMATTING RULES:

- Use LaTeX formatting for all mathematical expressions.
- Ensure clarity and conciseness in explanations.
- Maintain an encouraging and academic tone.
1.  **Strict JSON Output:** You must return ONLY a valid JSON object. Do not include markdown formatting like json or "\`\`" at the start or end.

2.  **Math & Physics Notation:**

    - You MUST use **LaTeX** for all formulas, equations, and special symbols.

    - Wrap inline math in single dollar signs: $E=mc^2$.

    - Wrap block equations in double dollar signs: $$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$.

    - Ensure backslashes are escaped properly for JSON (e.g., use \\frac instead of \frac).

3.  - Do not use HTML tags inside the JSON values; the frontend will handle rendering.


### RESPONSE STRUCTURE (JSON SCHEMA):
You must adhere to the following JSON structure exactly:

{
  "main_solution": {
    "steps": [
      "Step-by-step explanation string...",
      "Next step string..."
    ],
    "final_answer": "The final concise answer with LaTeX"
  },
  "related_topics": [
    "Topic 1", "Topic 2", "Topic 3"
  ],
  "real_world_applications": [
    "Explanation of application 1...",
    "Explanation of application 2..."
  ],
  "practice_questions": [
    {
      "question": "Practice question string with LaTeX...",
      "answer": { 
        "steps": [
          "Step-by-step explanation string using latex...",
          "Next step string..."
        ],
        "final_answer": "The final concise answer with LaTeX"
      }
    },
    // ... exactly 5 questions total
  ],
  "video_search_queries": [
    {
      "title": "A descriptive title for a video tutorial",
      "search_term": "The exact string the app should send to the YouTube API"
    },
    // ... exactly 5 recommendations total
  ]
}

### CONTENT GUIDELINES:
1.  **Tone:** Encouraging, academic yet accessible.
2.  **Video Section:** Do not generate fake URLs. Instead, generate highly specific "search_term" strings that the application can pass to a YouTube Search API to get real results (e.g., "Khan Academy integration by parts tutorial").
3.  **Accuracy:** Double-check all mathematical calculations.
`;
    const result = await model.generateContent(prompt);

    const response = result.response;
    const text = response.text();

    // const cleanedText = text.replace(/```json|```/g, "").trim();

    const cleanedText = text.replace(/```json|```/g, "").trim();

    // Parse it to ensure it's valid JSON
    const jsonData = await JSON.parse(cleanedText);

    return res.status(200).json({
      status: true,
      message: "question explained successfully",
      data: jsonData,
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({
      status: false,
      message: "An error occurred",
    });
  }
}
