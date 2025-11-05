// REF: This is modified code from week 7 applied class - where the llm returns a question with a corresponding difficulty
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";

// building the API with the following imports and configurations
dotenv.config();

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

// define the schema: get reliable output from the model, 
// we define the shape of data we want using zod
const questionSchema = z.object({
  question: z.string(),
  difficulty: z.enum(["Easy", "Intermediate", "Advanced"])
});

function getModel() {
  const provider = process.env.AI_PROVIDER;
  if (provider === "openai") {
    return new ChatOpenAI({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.7,
    });
  }
  if (provider === "anthropic") {
    return new ChatAnthropic({
      model: process.env.ANTHROPIC_MODEL || "claude-3-haiku-20240307",
      temperature: 0.7,
    });
  }
  throw new Error(`Unsupported AI provider: ${provider}`);
}

const baseModel = getModel();

// Specifying Prompt Template: defining a system + human message to guide the model
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a hiring manager. Generate a single interview question relervant to the interview details. Interview details include: title, job role and description",
  ],
  [
    "human",
    "Title of interview is {title}, job role is {job_role} and description is {description}\nReturn only the question content (no explanations).",
  ],
]);

// Implement the API endpoint: 
// i.e. deginf the route, specifyinf HTTP methods, and writing server-size code 
// writing server side-code that exectues when a client hits that endpoint
// and formatting the response consistently
app.all("/api/generate-question", async (req, res) => {
    // NOTE: This only supports both GET (read) and POST (create)
  try {
    const interviewDetail =
      req.method === "GET"
        ? {
            title: req.query.title,
            job_role: req.query.job_role,
            description: req.query.description, 
          }
        : req.body; // TODO: develop post operation. Ask tutors for more details. Maybe use post for allowing people taking interview allow to ask question to clarify interview questoin

    if (!interviewDetail?.title || !interviewDetail?.job_role || !interviewDetail?.description) {
      return res.status(400).json({ error: "Interview details are required" });
    }

    const modelWithSchema = baseModel.withStructuredOutput(questionSchema, {
      name: "question",
      strict: true,
    });

    const chain = prompt.pipe(modelWithSchema);
    const question = await chain.invoke({title: interviewDetail.title, job_role: interviewDetail.job_role, description: interviewDetail.description});

    const parsed = questionSchema.safeParse(question);
    if (!parsed.success) {
      return res.status(502).json({
        error: "Model returned invalid schema",
        details: parsed.error.flatten(),
      });
    }

    res.json(parsed.data);
  } catch (err) {
    console.error("Error generating question:", err);
    res.status(500).json({ error: "Failed to generate question" });
  }
});

// Creating a socket and listening into it for client requests
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));