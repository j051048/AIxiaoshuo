import { GoogleGenAI, Chat, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

let customApiKey: string | null = null;
let customBaseUrl: string | null = null;

export const updateConfig = (apiKey: string, baseUrl?: string) => {
  customApiKey = apiKey;
  customBaseUrl = baseUrl || null;
  // Reset instance to force recreation with new config
  genAI = null;
  chatSession = null;
};

const getGenAI = () => {
  if (!genAI) {
    const key = customApiKey || process.env.API_KEY;
    if (!key) {
      console.error("API_KEY is missing. Please configure it in settings.");
    }
    
    const options: any = { apiKey: key };
    // Handle custom Base URL if provided
    if (customBaseUrl) {
        options.rootUrl = customBaseUrl; 
    }

    genAI = new GoogleGenAI(options);
  }
  return genAI;
};

export const initializeChat = async () => {
  const ai = getGenAI();
  
  // We use gemini-2.5-flash for responsiveness.
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        }
      ],
    },
  });
  
  return chatSession;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!chatSession) {
    await initializeChat();
  }

  if (!chatSession) {
    throw new Error("Failed to initialize chat session");
  }

  try {
    const result = await chatSession.sendMessage({ message });
    return result.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Network error or API limit reached. Please check your API Key and Settings.";
  }
};

/**
 * Tests the API connection with specific credentials without saving them to the global state.
 */
export const testApiConnection = async (apiKey: string, baseUrl?: string): Promise<boolean> => {
  if (!apiKey) return false;
  try {
    const options: any = { apiKey };
    if (baseUrl) options.rootUrl = baseUrl;
    
    // Create a temporary client just for testing
    const tempAI = new GoogleGenAI(options);
    
    // Simple generation request to verify connectivity
    await tempAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'ping',
    });
    
    return true;
  } catch (e) {
    console.error("Test connection failed:", e);
    return false;
  }
};