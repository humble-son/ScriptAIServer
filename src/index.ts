import express, { response, type Request, type Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";

import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000", // Allow only your frontend
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
  "time_of_day": "Night"`;

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
