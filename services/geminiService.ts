
import { SYSTEM_INSTRUCTION } from "../constants";
import { Message, ConsistencyMemory } from "../types";

let customApiKey: string = "";
let customBaseUrl: string = "https://vip.apiyi.com/v1beta";

export const updateConfig = (apiKey: string, baseUrl?: string) => {
  customApiKey = apiKey || "";
  if (baseUrl) {
    // Remove trailing slash to ensure clean url construction
    customBaseUrl = baseUrl.replace(/\/+$/, '');
  }
};

const getHeaders = () => {
  return {
    'Content-Type': 'application/json'
  };
};

const getUrl = (model: string) => {
  return `${customBaseUrl}/models/${model}:generateContent?key=${customApiKey}`;
};

/**
 * Summarizes the latest content to update the Consistency Memory Bank.
 */
export const generateConsistencySummary = async (newContent: string, currentMemory: ConsistencyMemory): Promise<ConsistencyMemory> => {
  if (!customApiKey) return currentMemory;

  const prompt = `
    You are a Consistency Auditor for a novel.
    Based on the following NEW content, update the MEMORY BANK.
    Keep it extremely concise (bullet points). Focus on facts, character changes, and plot milestones.
    
    NEW CONTENT:
    ${newContent}
    
    OLD MEMORY:
    Plot: ${currentMemory.plotPoints?.join('; ') || ""}
    Characters: ${currentMemory.characterStates || ""}
    Rules: ${currentMemory.worldRules?.join('; ') || ""}
    
    Output JSON format:
    {
      "plotPoints": ["new point 1", "new point 2"],
      "characterStates": "updated status string",
      "worldRules": ["rule 1", "rule 2"]
    }
  `;

  try {
    const response = await fetch(getUrl('gemini-3-flash-preview'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    
    if (!response.ok) {
        console.warn("Memory update API failed:", response.statusText);
        return currentMemory;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(text);
    
    // Defensive normalization to prevent .length errors in UI
    return {
      plotPoints: Array.isArray(parsed.plotPoints) ? parsed.plotPoints : currentMemory.plotPoints || [],
      characterStates: typeof parsed.characterStates === 'string' ? parsed.characterStates : currentMemory.characterStates || "",
      worldRules: Array.isArray(parsed.worldRules) ? parsed.worldRules : currentMemory.worldRules || []
    };
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
  if (!customApiKey) return "[System Error: API Configuration Missing]";

  // Inject Consistency Memory into the prompt
  let augmentedPrompt = message;
  if (memory && ((memory.plotPoints?.length || 0) > 0 || memory.characterStates)) {
    augmentedPrompt = `
[CONSISTENCY REFERENCE]
- PLOT: ${memory.plotPoints?.join(' | ') || "None"}
- CHARACTERS: ${memory.characterStates || "None"}
- WORLD RULES: ${memory.worldRules?.join(' | ') || "None"}
---
${message}`;
  }

  // Convert history to REST API format
  // Filter out system messages as they are not part of the conversation history for the model
  const contents = historyMessages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

  // Append the new user message
  contents.push({
    role: 'user',
    parts: [{ text: augmentedPrompt }]
  });

  const body = {
    contents: contents,
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    generationConfig: {
      temperature: 0.7,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
  };

  try {
    const response = await fetch(getUrl(model), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `API Error ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.error.message) {
            errorMsg += `: ${errorJson.error.message}`;
        } else {
            errorMsg += `: ${errorText}`;
        }
      } catch (e) {
        errorMsg += `: ${errorText}`;
      }
      return `[${errorMsg}]`;
    }

    const data = await response.json();
    
    // Check for blocked content or empty response
    if (data.promptFeedback?.blockReason) {
        return `[Blocked: ${data.promptFeedback.blockReason}]`;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || "[Empty Response]";

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return `[Network Error] ${error.message}`;
  }
};

export const testApiConnection = async (apiKey: string, baseUrl?: string): Promise<boolean> => {
  if (!apiKey) return false;
  try {
    let urlBase = baseUrl ? baseUrl.replace(/\/+$/, '') : "https://vip.apiyi.com/v1beta";
    const url = `${urlBase}/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }]
      })
    });
    
    return response.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
};
