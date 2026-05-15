import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testTTS() {
  try {
    const hindiText = "नमस्ते, यह एक परीक्षण है";
    const voiceName = "Charon";
    console.log("Calling TTS...");
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: hindiText }] }],
      config: {
        responseModalities: ['AUDIO'], // or Modality.AUDIO
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    // console.dir(response, { depth: null });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    console.log("Got base64:", base64Audio ? "Yes, length: " + base64Audio.length : "No");

    if (response.candidates?.[0]?.content?.parts) {
      console.log("Parts keys:", response.candidates[0].content.parts.map(p => Object.keys(p)));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testTTS();
