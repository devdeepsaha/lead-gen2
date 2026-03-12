import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { leadName, category, status, userThought, auth, rating, reviews, hasWebsite } = req.body;

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
You are helping write a personalized outreach observation.

Context:
- Business: ${leadName}
- Category: ${category}
- Google Rating: ${rating} stars
- Total Reviews: ${reviews}
- Website Status: ${hasWebsite ? "Has a website" : "No website found"}

User Observation:
"${userThought}"

Write TWO short natural-sounding sentence that feels like a real person noticed something about the business.

Rules:
- Never criticize the business or sound negative.
- Do not use words like: shame, bad, poor, problem, issue, mistake, wrong, broken.
- Keep the tone respectful and neutral.
- No greetings.
- No introductions.
- No selling language like "I can help" or "you should".
- Sound observational, not promotional.
- Mention the business name if natural.
- If no website → highlight missed online presence.
- If many reviews → highlight strong reputation.
- If rating is low → highlight reputation improvement opportunity.
- Avoid sounding like AI. Write like a person texting another person. Avoid dashes — instead use , comma
- It should sound like something typed quickly on WhatsApp or email.
- Do not mention conversions, optimization, or marketing performance.

Examples of good hooks:
• "I noticed ${leadName} has strong Google reviews but doesn’t seem to have an official website yet."
• "Saw ${leadName} has over ${reviews} reviews, that kind of reputation deserves a strong website."
• "Looks like ${leadName} currently doesn’t have a website, which might make it harder for new customers to find you."

Return ONLY the sentence.
`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text().replace(/["]/g, "").trim();

    return res.status(200).json({ message: text.trim() });
  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({ message: 'AI processing failed' });
  }
}