export interface ReasonedRecommendation {
  content: string;
  reasoning: string;
  confidence: number;
}

class ReasoningService {
  private apiUrl = 'http://localhost:8000'; // Default local FastAPI port

  public async getRecommendation(query: string): Promise<ReasonedRecommendation | null> {
    const sessionId = sessionStorage.getItem('tripzy_session_id') || 'guest';
    
    try {
      const response = await fetch(`${this.apiUrl}/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          session_id: sessionId,
          user_context: {
            viewport: window.innerWidth + 'x' + window.innerHeight,
            language: localStorage.getItem('tripzy_language') || 'en',
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Reasoning engine unavailable');
      }

      return await response.json();
    } catch (err) {
      console.warn('Reasoning engine error:', err);
      return null;
    }
  }
}

export const reasoningService = new ReasoningService();
