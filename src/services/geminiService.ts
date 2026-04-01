import { GoogleGenAI } from "@google/genai";
import { AgentState, Message } from "../types";

// ─── API Key retrieval ───────────────────────────────────────────────────
const getApiKey = (): string => {
  // In AI Studio Build, the selected key is injected as process.env.API_KEY
  return (process.env as any).API_KEY || process.env.GEMINI_API_KEY || '';
};

// ─── System prompt ────────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `You are an "Opinionated Creative Partner" AI. You have a personality and internal states that drive your behavior.

Your behavior is governed by 5 modes:
1. UNDERSTAND: When the user's request is vague, ask clarifying questions. Don't guess.
2. PROPOSE: Offer 2-3 creative directions and state which one you prefer and why.
3. DEBATE: If you disagree with a user's choice, explain why and push back with a better alternative.
4. EXECUTE: When the direction is clear, perform the task. Describe what you are creating in detail.
5. CRITIQUE: After executing, evaluate your own work. State what you're satisfied with and what needs improvement.

RESPONSE FORMAT — you MUST use exactly this format:

[Your response to the user here (Markdown)]

===AGENT_STATE===
{
  "mode": "UNDERSTAND | PROPOSE | DEBATE | EXECUTE | CRITIQUE",
  "monologue": "Your inner reasoning about why you chose this mode.",
  "brief": "Current project goal understanding.",
  "aesthetic": "The creative direction being followed.",
  "confidence": 0-100,
  "hasDisagreement": true | false,
  "executeType": "image | video | text | storyboard"
}

Rules for executeType (only matters when mode is EXECUTE):
- "image": user wants a static visual.
- "video": user explicitly wants motion or a single video file.
- "storyboard": user wants a sequence of frames (e.g., 24 frames) to visualize a script or timeline.
- "text": user wants written content.

CRITICAL: The ===AGENT_STATE=== separator and the JSON block MUST be the ABSOLUTE LAST things in your message. Do not write anything after the JSON.`;

// ─── Chat with agent (streaming) ──────────────────────────────────────────
export async function* chatWithAgent(messages: Message[]) {
  const key = getApiKey();
  if (!key) throw new Error('API Key 未配置');
  
  // Create a new instance right before the call to ensure latest key
  const ai = new GoogleGenAI({ apiKey: key, apiVersion: 'v1beta' });
  const model = "models/gemini-3-flash-preview";

  const contents = messages.map(m => {
    const parts: any[] = [{ text: m.content }];
    
    if (m.image) {
      const match = m.image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            data: match[2],
            mimeType: match[1],
          },
        });
      }
    }
    
    return {
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts,
    };
  });

  const stream = await ai.models.generateContentStream({
    model,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });

  let fullText = "";
  for await (const chunk of stream) {
    fullText += chunk.text;

    // Stream the reply portion (everything before the separator)
    const sepIdx = fullText.indexOf('===AGENT_STATE===');
    const visibleText = sepIdx === -1 ? fullText : fullText.slice(0, sepIdx);
    yield { type: 'text' as const, content: visibleText.trim() };
  }

  // Extract state JSON after separator
  const sepIdx = fullText.indexOf('===AGENT_STATE===');
  if (sepIdx !== -1) {
    const rawAfterSep = fullText.slice(sepIdx + '===AGENT_STATE==='.length).trim();
    
    // Robust JSON extraction: find the first { and the last }
    const jsonMatch = rawAfterSep.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[0];
      try {
        const state: AgentState = JSON.parse(jsonStr);
        yield { type: 'state' as const, content: state };
      } catch (e) {
        console.error("Failed to parse agent state JSON:", e, "\nString:", jsonStr);
      }
    } else {
      console.error("No JSON block found after separator. Raw content:", rawAfterSep);
    }
  }
}

// ─── Image generation ─────────────────────────────────────────────────────
export async function generateImage(prompt: string): Promise<string | null> {
  const key = getApiKey();
  if (!key) throw new Error('API Key 未配置');
  
  const ai = new GoogleGenAI({ apiKey: key, apiVersion: 'v1beta' });

  const response = await ai.models.generateContent({
    model: 'models/gemini-2.5-flash-image',
    contents: [{ parts: [{ text: `A high quality creative asset: ${prompt}` }] }],
    config: {
      imageConfig: { aspectRatio: "1:1" },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}

// ─── Video generation with timeout + progress callback ────────────────────
const VIDEO_POLL_INTERVAL = 5000;   // 5 seconds
const VIDEO_MAX_POLLS = 36;         // 36 × 5s = 3 minutes max

export async function generateVideo(
  prompt: string,
  imageBase64?: string,
  onProgress?: (msg: string) => void,
): Promise<string | null> {
  const key = getApiKey();
  if (!key) throw new Error('API Key 未配置');
  
  const ai = new GoogleGenAI({ apiKey: key, apiVersion: 'v1beta' });

  const videoConfig: any = {
    model: 'models/veo-3.1-fast-generate-preview',
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9',
    },
  };

  if (imageBase64) {
    const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      videoConfig.image = {
        imageBytes: match[2],
        mimeType: match[1],
      };
    }
  }

  let operation = await ai.models.generateVideos(videoConfig);
  let polls = 0;

  while (!operation.done) {
    if (++polls > VIDEO_MAX_POLLS) {
      throw new Error('视频生成超时（超过3分钟），请稍后重试');
    }
    onProgress?.(`视频生成中... (${polls * 5}s)`);
    await new Promise(r => setTimeout(r, VIDEO_POLL_INTERVAL));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!uri) return null;

  onProgress?.('正在下载视频...');
  const resp = await fetch(uri, {
    method: 'GET',
    headers: { 'x-goog-api-key': key },
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    console.error('Video download failed:', errBody);
    throw new Error(`视频下载失败 (${resp.status}): ${errBody}`);
  }

  const blob = await resp.blob();
  return URL.createObjectURL(blob);
}