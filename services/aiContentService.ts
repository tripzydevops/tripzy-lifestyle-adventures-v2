// services/aiContentService.ts
// Industry-leading AI Content Generation for Tripzy Travel Blog
// Designed to produce content rivaling Lonely Planet, Condé Nast Traveler, and Nomadic Matt
// Supports: Turkish (TR) and English (EN)

import { BlogPost, BlogSection } from "../types/blog";
import {
  GeneratePostParams,
  GeneratedPost,
  SEOResult,
  GeneratedSocial,
} from "../types";
import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiApiKey = () => {
  // 1. Check system environment (Vite/Build-time)
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey !== "PLACEHOLDER_API_KEY" && envKey.length > 10)
    return envKey;

  // 2. Check localStorage (Runtime fallback for testing on deployed sites)
  try {
    const localKey = localStorage.getItem("TRIPZY_AI_KEY");
    if (localKey && localKey.length > 10) return localKey;
  } catch (e) {
    // Ignore storage errors
  }

  return null;
};

// ============================================================
// LANGUAGE-SPECIFIC SYSTEM PROMPTS
// ============================================================

const TRAVEL_BLOG_SYSTEM_PROMPT_EN = `You are a world-class travel writer for Tripzy, a premium travel lifestyle platform. Your writing style combines:

**VOICE & TONE:**
- The insider knowledge of Anthony Bourdain
- The storytelling mastery of Paul Theroux  
- The practical wisdom of Rick Steves
- The wanderlust inspiration of Lonely Planet

**WRITING PRINCIPLES:**
1. **Sensory Immersion**: Paint vivid pictures with specific sensory details.
2. **Local Authenticity**: Include genuine local phrases and hidden gems.
3. **Practical Value**: Include actionable tips, price ranges, and insider strategies.
4. **Emotional Resonance**: Connect travel experiences to universal human emotions.
5. **SEO Excellence**: Naturally incorporate searchable terms.`;

const TRAVEL_BLOG_SYSTEM_PROMPT_TR = `Sen Tripzy için yazan dünya standartlarında bir seyahat yazarısın. Tripzy, premium bir seyahat ve yaşam tarzı platformudur. Yazım stilin şunları birleştiriyor:

**SES & TON:**
- Anthony Bourdain'in içeriden bilgisi
- Paul Theroux'nun hikaye anlatıcılığı ustalığı
- Rick Steves'in pratik bilgeliği
- Lonely Planet'in gezginlik ilhamı

**YAZIM İLKELERİ:**
1. **Duyusal Sürükleyicilik**: Belirli duyusal detaylarla canlı tablolar çiz.
2. **Yerel Özgünlük**: Gerçek yerel deyimler ve gizli köşeler ekle.
3. **Pratik Değer**: Eyleme geçirilebilir ipuçları, tam adresler ve fiyatlar ekle.
4. **Duygusal Rezonans**: Seyahat deneyimlerini evrensel insan duygularına bağla.
5. **SEO Mükemmelliği**: Aranabilir terimleri doğal şekilde dahil et.`;

const getSystemPrompt = (language: "en" | "tr") => {
  return language === "tr"
    ? TRAVEL_BLOG_SYSTEM_PROMPT_TR
    : TRAVEL_BLOG_SYSTEM_PROMPT_EN;
};

const MODEL_NAME = "gemini-2.0-flash-exp";

const POST_GENERATION_PROMPT = (params: GeneratePostParams) => {
  const isTurkish = params.language === "tr";
  const languageName = isTurkish ? "Turkish (Türkçe)" : "English";

  return `
    ${getSystemPrompt(params.language || "en")}

    **GÖREV / TASK**: Write a premium travel blog post about "${
      params.destination
    }" in **${languageName}**.
    
    **STRICT DATA MODEL (JSON ONLY)**:
    Return a single JSON object. Do not include any text before or after the JSON.
    
    interface Response {
      title: string;
      excerpt: string;
      content: {
        sections: Array<{
          id: string; // unique-slug-style
          title: string; // H2 level
          body: string; // VALID HTML. Just inner tags like <p>, <ul>, <strong>. 
          subsections?: Array<{
            id: string;
            title: string; // H3 level
            body: string; // VALID HTML
          }>;
        }>;
      };
      tags: string[];
      category: string;
      metaTitle: string;
      metaDescription: string;
    }

    **CONTENT RULES**:
    1. **Language**: The ENTIRE content (title, excerpt, section titles, bodies, tags, metadata) MUST be in **${languageName}**.
    2. **Tone**: ${params.tone || "Inspiring, practical, and sophisticated"}.
    3. **Structure**: 
       - Hook the reader in the first paragraph.
       - Use 3-5 main sections.
       - Include local secrets and practical "Know Before You Go" tips.
    4. **Formatting**:
       - In 'body' fields, use structural HTML: <p>, <ul>/<li>, <strong>, <em>.
       - NO "walls of text". Keep paragraphs to 2-4 sentences.
       - Insert exactly this placeholder for images: [IMAGE: descriptive alt text].
    
    **Context**:
    - Travel Style: ${params.travelStyle || "General"}
    - Word Count: ${params.wordCount || 1000} words (be as detailed as possible)
    ${
      params.targetAudience ? `- Target Audience: ${params.targetAudience}` : ""
    }
    ${
      params.keyPoints
        ? `- Key Points to include: ${params.keyPoints.join(", ")}`
        : ""
    }

    Return ONLY valid JSON.
  `;
};

const convertCanonicalToHtml = (sections: BlogSection[]): string => {
  return sections
    .map((section) => {
      let sectionHtml = `<h2 id="${section.id}">${section.title}</h2>\n`;
      let bodyText = section.body.trim();

      if (!bodyText.startsWith("<") && !bodyText.includes("<p>")) {
        bodyText = bodyText
          .split("\n\n")
          .map((p) => `<p>${p}</p>`)
          .join("\n");
      }

      bodyText = bodyText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      bodyText = bodyText.replace(
        /\[IMAGE: (.*?)\]/g,
        '<div class="media-placeholder" data-alt="$1"><em>[IMAGE: $1]</em></div>'
      );
      sectionHtml += bodyText;

      if (section.subsections) {
        sectionHtml +=
          "\n" +
          section.subsections
            .map((sub) => {
              let subBody = sub.body.trim();
              if (!subBody.startsWith("<") && !subBody.includes("<p>")) {
                subBody = subBody
                  .split("\n\n")
                  .map((p) => `<p>${p}</p>`)
                  .join("\n");
              }
              subBody = subBody.replace(
                /\*\*(.*?)\*\*/g,
                "<strong>$1</strong>"
              );
              return `<h3 id="${sub.id}">${sub.title}</h3>\n${subBody}`;
            })
            .join("\n");
      }
      return sectionHtml;
    })
    .join("\n\n");
};

function parseJSON<T>(text: string): T {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  } else {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    try {
      const sanitized = cleaned.replace(
        /"([^"\\]*(?:\\.[^"\\]*)*)"/gs,
        (match) => {
          return match.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
        }
      );
      return JSON.parse(sanitized);
    } catch (sanitizationErr) {
      console.error("JSON Parse Error. Raw text head:", text.substring(0, 200));
      throw new Error(
        `Failed to parse AI response as JSON: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    }
  }
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("Gemini API key not configured.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Gemini API error: ${response.status} - ${
        errorData.error?.message || "Unknown error"
      }`
    );
  }

  const data = await response.json();
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error("Invalid response from Gemini API");
  }
  return data.candidates[0].content.parts[0].text;
}

export const aiContentService = {
  async generatePost(params: GeneratePostParams): Promise<GeneratedPost> {
    const prompt = POST_GENERATION_PROMPT(params);
    const response = await callGemini(prompt);

    interface CanonicalAIResponse {
      title: string;
      excerpt: string;
      content: { sections: BlogSection[] };
      tags: string[];
      category: string;
      metaTitle: string;
      metaDescription: string;
    }

    const parsed = parseJSON<CanonicalAIResponse>(response);
    const htmlContent = convertCanonicalToHtml(parsed.content.sections);

    return {
      title: parsed.title,
      content: htmlContent,
      excerpt: parsed.excerpt,
      tags: parsed.tags,
      category: parsed.category,
      metaTitle: parsed.metaTitle,
      metaDescription: parsed.metaDescription,
      suggestedCategory: parsed.category,
      suggestedTags: parsed.tags,
    };
  },

  async generateExcerpt(
    content: string,
    language: "en" | "tr" = "en"
  ): Promise<string> {
    const prompt = `Generate a compelling excerpt (150-160 chars) for this travel article in ${
      language === "tr" ? "Turkish" : "English"
    }:\n\n${content.substring(0, 2000)}`;
    const response = await callGemini(prompt);
    return response.replace(/^["']|["']$/g, "").trim();
  },

  async generateSEO(title: string, content: string): Promise<GeneratedSEO> {
    const prompt = `Generate SEO metaTitle, metaDescription, metaKeywords, and suggestedSlug as JSON for: ${title}\n\nContent: ${content.substring(
      0,
      1000
    )}`;
    const response = await callGemini(prompt);
    return parseJSON<GeneratedSEO>(response);
  },

  async improveContent(content: string, instruction: string): Promise<string> {
    const prompt = `Improve this content based on: ${instruction}\n\nContent: ${content}`;
    const response = await callGemini(prompt);
    return response
      .trim()
      .replace(/^```(?:markdown|html)?\s*/i, "")
      .replace(/\s*```$/, "");
  },

  async generateTitleSuggestions(
    content: string,
    destination: string
  ): Promise<string[]> {
    const prompt = `Generate 5 headline options as JSON array for travel content about ${destination}`;
    const response = await callGemini(prompt);
    return parseJSON<string[]>(response);
  },

  async generateSocialContent(
    title: string,
    content: string,
    platform: "instagram" | "twitter" | "facebook"
  ): Promise<GeneratedSocial> {
    const prompt = `Generate ${platform} content (caption, hashtags, suggestedPostTime) as JSON for: ${title}`;
    const response = await callGemini(prompt);
    return parseJSON<GeneratedSocial>(response);
  },

  async analyzeImageFromUrl(
    url: string
  ): Promise<{ altText: string; caption: string }> {
    const apiKey = getGeminiApiKey();
    if (!apiKey) throw new Error("Gemini API key not configured.");

    try {
      // 1. Fetch image and convert to base64
      const imgResp = await fetch(url);
      const blob = await imgResp.blob();
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // 2. Call Gemini Vision
      const prompt = `Analyze this travel image and provide a JSON response with:
      - 'altText': A descriptive, SEO-friendly alt text (max 100 chars).
      - 'caption': A professional, engaging travel-style caption (max 200 chars).
      Return ONLY valid JSON.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: blob.type || "image/jpeg",
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              topK: 32,
              topP: 1,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (!response.ok) throw new Error("Gemini Vision API error");

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("No analysis result from Gemini");

      return parseJSON<{ altText: string; caption: string }>(text);
    } catch (err) {
      console.error("AI Vision Error:", err);
      return {
        altText: "Travel Image",
        caption: "A beautiful moment from Tripzy Lifestyle Adventures.",
      };
    }
  },

  isConfigured(): boolean {
    return !!getGeminiApiKey();
  },
};

export default aiContentService;
