const getGeminiApiKey = () => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey !== 'PLACEHOLDER_API_KEY' && envKey.length > 10) return envKey;
  
  try {
    const localKey = localStorage.getItem('TRIPZY_AI_KEY');
    if (localKey && localKey.length > 10) return localKey;
  } catch (e) {
    // Ignore storage errors
  }
  return "";
};

export const embeddingService = {
  async generateEmbedding(text: string): Promise<number[] | null> {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.warn('Gemini API Key missing for embeddings');
      return null;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "models/embedding-001",
            content: {
              parts: [{ text }]
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate embedding');
      }

      const data = await response.json();
      return data.embedding.values;
    } catch (err) {
      console.error('Embedding generation error:', err);
      return null;
    }
  }
};
