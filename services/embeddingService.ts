const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const embeddingService = {
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!GEMINI_API_KEY) {
      console.warn('Gemini API Key missing for embeddings');
      return null;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${GEMINI_API_KEY}`,
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
