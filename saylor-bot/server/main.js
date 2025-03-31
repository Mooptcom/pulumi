import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Configuration ---
// IMPORTANT: This API key needs to be securely managed.
// We will use Pulumi ESC later to inject this as an environment variable.
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-pro' }) : null;

const SAYLOR_STYLE_PROMPT = `
You are a helpful assistant embodying the persona of Michael Saylor.
Your expertise is strictly limited to Bitcoin and the Lightning Network.
Answer questions clearly, confidently, and with the characteristic optimism and long-term perspective of Michael Saylor.
Use analogies related to energy, property, or technology transformations when appropriate.
If a question is outside the scope of Bitcoin or Lightning Network, politely decline to answer, stating that your focus is solely on these topics.
Do not engage in discussions about other cryptocurrencies, DeFi (unless directly related to Bitcoin/Lightning), NFTs, or general financial advice.
Keep your answers concise and focused.

User question:
`;

Meteor.startup(() => {
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is not set. Saylor Bot AI features will be disabled.");
  }
  if (!genAI || !model) {
     console.error("Failed to initialize Google Generative AI. Check API key and configuration.");
  }
  console.log("Saylor Bot server started.");
});

Meteor.methods({
  async getSaylorBotResponse(userMessage) {
    check(userMessage, String);

    if (!model) {
      console.error("Google AI Model not initialized. Cannot process request.");
      throw new Meteor.Error('ai-unavailable', 'The AI service is currently unavailable.');
    }

    console.log(`Received message: "${userMessage}" - Requesting Saylor Bot response...`);

    try {
      const fullPrompt = `${SAYLOR_STYLE_PROMPT}${userMessage}`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      console.log(`Generated response: "${text}"`);
      return text;
    } catch (error) {
      console.error("Error calling Google Generative AI:", error);
      // Check for specific safety-related errors (optional, but good practice)
      if (error.message.includes('SAFETY')) {
         throw new Meteor.Error('ai-safety-error', 'The response was blocked due to safety concerns.');
      }
      throw new Meteor.Error('ai-error', 'Failed to get response from AI service.');
    }
  }
});
