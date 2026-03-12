import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { leadName, category, status, userThought, auth } = req.body;

  // RECENTLY ADDED: Debug logs to see why 401 is happening
  console.log("Auth received from frontend:", auth);
  console.log("Admin Key stored in Vercel:", process.env.ADMIN_KEY);

  if (auth !== process.env.ADMIN_KEY) {
    return res.status(401).json({ 
      message: 'Unauthorized', 
      debug: "Check Vercel Logs for comparison" 
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // RECENTLY CHANGED: Using the latest alias to ensure 3.1 Flash Lite compatibility
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    const systemPrompt = `
      You are a professional outreach assistant. 
      Business: ${leadName}
      Category: ${category}
      Goal Type: ${status}
      
      Task: Write a single, punchy opening sentence for a message. 
      Incorporate this specific observation: "${userThought}".
      Keep it natural, no placeholders, no subject lines.
    `;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ message: text.trim() });
  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({ message: 'AI processing failed' });
  }
}