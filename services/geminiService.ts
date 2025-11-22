import { GoogleGenAI, Chat, GenerateContentResponse, Modality, Type } from '@google/genai';
import { GEMINI_CHAT_MODEL, GEMINI_TTS_MODEL } from '../constants';
import { ComicPanel } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

let chatInstance: Chat | null = null;

export const getChatInstance = (): Chat => {
  if (!chatInstance) {
    chatInstance = ai.chats.create({
      model: GEMINI_CHAT_MODEL,
    });
  }
  return chatInstance;
};

export const getChatResponseStream = async (prompt: string) => {
  const chat = getChatInstance();
  return await chat.sendMessageStream({ message: prompt });
};

export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_CHAT_MODEL,
        contents: { parts: [imagePart, textPart] }
    });
    
    return response.text ?? "Lo siento, no pude analizar la imagen.";
  } catch (error) {
    console.error("Error analyzing image:", error);
    return "Ocurrió un error al analizar la imagen. Por favor, revisa la consola para más detalles.";
  }
};


export const generateStoryFromImage = async (imageBase64: string, mimeType: string): Promise<string> => {
  try {
    const prompt = "Analiza el ambiente y la escena de esta imagen. Escribe el párrafo inicial de una historia ambientada en este mundo, en español.";
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      },
    };
    const textPart = { text: prompt };
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_CHAT_MODEL,
      contents: { parts: [imagePart, textPart] }
    });
    
    return response.text ?? "No se pudo generar una historia para esta imagen.";
  } catch (error) {
    console.error("Error generating story:", error);
    return "Ocurrió un error al generar la historia. Por favor, revise la consola para más detalles.";
  }
};


export const generateSpeech = async (text: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: GEMINI_TTS_MODEL,
            contents: [{ parts: [{ text: `Lee esto con una voz expresiva: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Puck' }, // A voice that might support Spanish well
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio ?? null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
};

const parseJsonResponse = (jsonText: string | undefined): ComicPanel[] => {
    if (!jsonText) {
        throw new Error("La respuesta del modelo para el guion del cómic estaba vacía.");
    }
    try {
        return JSON.parse(jsonText.trim());
    } catch (e) {
        console.error("Error al parsear el JSON del guion del cómic:", e, "Texto recibido:", jsonText);
        throw new Error("La respuesta del modelo para el guion del cómic no era un JSON válido.");
    }
};

export const generateComicScript = async (prompt: string, panelCount: number): Promise<ComicPanel[]> => {
  const systemInstruction = `Eres un guionista de cómics. Crea un guion para un cómic de ${panelCount} viñetas basado en la petición del usuario. Para cada viñeta, proporciona una descripción visual detallada para un generador de imágenes y una breve línea de diálogo. Responde en español y únicamente con el JSON.`;

  const response = await ai.models.generateContent({
    model: GEMINI_CHAT_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "Descripción visual detallada de la escena de la viñeta.",
            },
            dialogue: {
              type: Type.STRING,
              description: "Diálogo o texto narrativo para la viñeta.",
            },
          },
          required: ["description", "dialogue"],
        },
      },
    },
  });

  return parseJsonResponse(response.text);
};


export const generateComicScriptFromImages = async (
  prompt: string,
  images: { base64: string; mimeType: string }[]
): Promise<ComicPanel[]> => {
  const systemInstruction = `Eres un guionista de cómics. Basado en la siguiente petición del usuario y la secuencia de imágenes proporcionadas, crea un guion de cómic. Para cada imagen, proporciona una descripción visual concisa de lo que ves y una breve línea de diálogo que encaje con la escena. El número de viñetas debe coincidir con el número de imágenes. Responde en español y únicamente con el JSON.`;

  const imageParts = images.map(img => ({
    inlineData: {
      data: img.base64,
      mimeType: img.mimeType,
    },
  }));
  const textPart = { text: prompt };

  const contents = { parts: [textPart, ...imageParts] };

  const response = await ai.models.generateContent({
    model: GEMINI_CHAT_MODEL,
    contents,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "Descripción visual detallada de la escena de la viñeta.",
            },
            dialogue: {
              type: Type.STRING,
              description: "Diálogo o texto narrativo para la viñeta.",
            },
          },
          required: ["description", "dialogue"],
        },
      },
    },
  });

  return parseJsonResponse(response.text);
};

const getStyleEnhancement = (style: string): string => {
    switch (style.toLowerCase()) {
        case 'manga':
            return 'en un estilo de arte manga en blanco y negro, con tramas de puntos y líneas de acción dinámicas.';
        case 'vintage':
            return 'en un estilo de cómic vintage de los años 50, con colores desaturados y estética de puntos Ben-Day.';
        case 'noir':
            return 'en un estilo de cómic noir, con alto contraste, sombras profundas, y una atmósfera sombría y cinematográfica.';
        case 'vibrante':
        default:
            return 'en un estilo de arte de cómic vibrante y de alto contraste.';
    }
}

export const generateImageForComic = async (prompt: string, style: string): Promise<string> => {
    const styleEnhancement = getStyleEnhancement(style);
    const fullPrompt = `${prompt}, ${styleEnhancement}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: fullPrompt }],
        },
        config: {
            imageConfig: {
                aspectRatio: "1:1",
            },
        },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("No se pudo generar la imagen para la viñeta del cómic.");
};