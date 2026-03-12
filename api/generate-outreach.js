import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  // RECENTLY CHANGED: Extracting 'images' array from request body
  const { 
    leadName, 
    category, 
    userThought, 
    auth, 
    rating, 
    reviews, 
    hasWebsite, 
    images // This is our array of { data: base64, type: mimeType }
  } = req.body;

  if (auth !== process.env.ADMIN_KEY) {
    return res.status(401).json({ 
      message: 'Unauthorized'
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Using 3.1 Flash Lite for fast, multimodal processing
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

Write THREE short natural-sounding sentence that feels like a real person noticed something about the business.

Rules:
-Avoid harsh or insulting language.
-Instead of criticizing, describe what is visible.

-Bad:
 "The layout is broken."

-Better:
 "I noticed some elements shift while the page loads."
 "I noticed the layout moves slightly while scrolling."
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
-Prefer observations about website behaviour over technical metric names.
-Interpret Lighthouse metrics like this:
- FCP under 2s → fast
- LCP under 2.5s → good
- TBT near 0 → smooth
- CLS above 0.25 → layout shifts noticeable
- Speed Index under 4s → fast

Screenshot Analysis Rules:

If screenshots are provided, you MUST analyze them first.

If any visual UI issue is visible in the screenshots, the FIRST sentence must describe that observation.

Do not ignore visible UI issues.

Look for:
- Missing images or icons
- Layout shifts or elements jumping
- Buttons that look confusing or misleading
- Outdated visual design
- Mobile layout issues
- Text overlapping or alignment problems
- Slow loading placeholders
- Broken or missing UI elements

Describe what you SEE rather than making assumptions.
Use neutral wording like:
"I noticed..."
"Looks like..."
"Seems like..."

Do not guess things that are not visible in the screenshot.

Observation Priority:

Use signals in this order of importance:
1. Visual issues visible in screenshots
2. Lighthouse performance signals
3. User observation text
4. Google reviews / reputation
5. Website presence

Prefer mentioning the most noticeable observation first.

Examples of good hooks:
• "I noticed ${leadName} has strong Google reviews but doesn’t seem to have an official website yet."
• "Saw ${leadName} has over ${reviews} reviews, that kind of reputation deserves a strong website."
• "Looks like ${leadName} currently doesn’t have a website, which might make it harder for new customers to find you."
• "I noticed the hero image on the homepage isn't loading."
• "Looks like some elements move while the page loads."
• "I noticed the layout shifts slightly when the page finishes loading."
• "I noticed the mobile layout stacks a bit tightly."
  Return ONLY the sentence.
`;

    
    const promptContent = [systemPrompt];

    if (images && Array.isArray(images)) {
      images.forEach(img => {
        promptContent.push({
          inlineData: {
            data: img.data,
            mimeType: img.type
          }
        });
      });
    }

    const result = await model.generateContent(promptContent);
    const response = await result.response;
    const text = response.text().replace(/["]/g, "").trim();

    return res.status(200).json({ message: text.trim() });
  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({ message: 'AI processing failed' });
  }
}