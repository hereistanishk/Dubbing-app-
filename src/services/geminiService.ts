import { GoogleGenAI } from "@google/genai";

// Initialize the API using the injected key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function translateToHindi(englishText: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "You are a professional documentary translator. Translate the following English script to Hindi. Ensure the tone is appropriate for a high-quality documentary. Only return the translated Hindi text.",
    config: {
      systemInstruction: "You only output the translated Hindi text. No quotes, no intro, no extra explanations.",
    }
  });
  
  // Second request to generate with text part
  const translationResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `English Document Script:\n${englishText}\n\nTranslate to Hindi:`,
    config: {
      systemInstruction: "You are an expert translator specializing in documentary scripts. Provide accurate, culturally appropriate Hindi translations of English text. Provide ONLY the translated Hindi output.",
      temperature: 0.3,
    }
  });

  return translationResponse.text || '';
}

export async function synthesizeSpeech(hindiText: string, voiceName: string): Promise<string | null> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: hindiText }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio || null;
}

export async function translateAudioToHindi(base64Audio: string, mimeType: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType
            }
          },
          { text: "Listen to this English audio documentary. Provide an accurate, high-quality translation of the transcript in Hindi. Ensure the tone is appropriate for a documentary. Provide ONLY the translated Hindi text." }
        ]
      }
    ],
    config: {
      temperature: 0.2,
    }
  });
  return response.text || '';
}

export async function translateVideoToHindi(base64Video: string, mimeType: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64Video,
              mimeType: mimeType
            }
          },
          { text: "Watch this English documentary video. Provide an accurate, high-quality translation of the spoken transcript in Hindi. Provide ONLY the translated Hindi text." }
        ]
      }
    ],
    config: {
      temperature: 0.2,
    }
  });
  return response.text || '';
}
