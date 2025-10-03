import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = (modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash") => {
  return genAI.getGenerativeModel({ model: modelName });
};

export { genAI, getModel };
