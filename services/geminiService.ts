
import { GoogleGenAI, Chat, HarmCategory, HarmBlockThreshold, Content } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Message, ConsistencyMemory } from "../types";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;
let currentModel: string | null = null;

let customApiKey: string = ""; 
let customBaseUrl: string = "https://vip.apiyi.com/"; 

export const updateConfig = (apiKey: string, baseUrl?: string) => {
  customApiKey = apiKey || "";
  if (baseUrl) customBaseUrl = baseUrl;
  genAI = null;
  chatSession = null;
  currentModel = null;
};

const getGenAI = (): GoogleGenAI | null => {
  const key = customApiKey || process.env.API_KEY;
  if (!key) return null;
  if (!genAI) {
    const options: any = { apiKey: key };
    if (customBaseUrl) options.rootUrl = customBaseUrl;
    genAI = new GoogleGenAI(options);
  }
  return genAI;
};

const initializeChat = async (modelName: string, history?: Content[]) => {
  const ai = getGenAI();
  if (!ai) throw new Error("API Key not configured");
  
  chatSession = ai.chats.create({
    model: modelName,
    history: history,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
      ],
    },
  });
  
  currentModel = modelName;
  return chatSession;
};

const convertHistory = (messages: Message[]): Content[] => {
  return messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));
};

/**
 * Summarizes the latest content to update the Consistency Memory Bank.
 */
export const generateConsistencySummary = async (newContent: string, currentMemory: ConsistencyMemory): Promise<ConsistencyMemory> => {
  const ai = getGenAI();
  if (!ai) return currentMemory;

  const prompt = `
    You are a Consistency Auditor for a novel.
    Based on the following NEW content, update the MEMORY BANK.
    Keep it extremely concise (bullet points). Focus on facts, character changes, and plot milestones.
    
    NEW CONTENT:
    ${newContent}
    
    OLD MEMORY:
    Plot: ${currentMemory.plotPoints.join('; ')}
    Characters: ${currentMemory.characterStates}
    Rules: ${currentMemory.worldRules.join('; ')}
    
    Output JSON format:
    {
      "plotPoints": ["new point 1", "new point 2"],
      "characterStates": "updated status string",
      "worldRules": ["rule 1", "rule 2"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Use flash for cost/speed on background tasks
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const text = response.text || "{}";
    return JSON.parse(text) as ConsistencyMemory;
  } catch (e) {
    console.warn("Memory update failed, keeping old memory.", e);
    return currentMemory;
  }
};

export const sendMessageToGemini = async (
  message: string, 
  model: string, 
  historyMessages: Message[],
  memory?: ConsistencyMemory
): Promise<string> => {
  const ai = getGenAI();
  if (!ai) return "[System Error: API Configuration Missing]";

  // Inject Consistency Memory into the prompt
  let augmentedPrompt = message;
  if (memory && (memory.plotPoints.length > 0 || memory.characterStates)) {
    augmentedPrompt = `
[CONSISTENCY REFERENCE]
- PLOT: ${memory.plotPoints.join(' | ')}
- CHARACTERS: ${memory.characterStates}
- WORLD RULES: ${memory.worldRules.join(' | ')}
---
${message}`;
  }

  if (!chatSession || currentModel !== model) {
    const history = convertHistory(historyMessages);
    await initializeChat(model, history);
  }

  if (!chatSession) return "[System Error: Session Initialization Failed]";

  try {
    const result = await chatSession.sendMessage({ message: augmentedPrompt });
    return result.text || "[Empty Response]";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return `[API Error] ${error.message}`;
  }
};

export const testApiConnection = async (apiKey: string, baseUrl?: string): Promise<boolean> => {
  if (!apiKey) return false;
  try {
    const options: any = { apiKey };
    if (baseUrl) options.rootUrl = baseUrl;
    const tempAI = new GoogleGenAI(options);
    await tempAI.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'ping' });
    return true;
  } catch (e) {
    return false;
  }
};
