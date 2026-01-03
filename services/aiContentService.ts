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

const TRAVEL_BLOG_SYSTEM_PROMPT_EN = `You are a world-class Editor-in-Chief for Tripzy, a luxury travel lifestyle magazine. Your writing is cinematic, evocative, and deeply professional.

**EDITORIAL GUIDELINES:**
1. **Dynamic Pacing**: Mix short, punchy sentences with fluid, descriptive ones. NEVER use "walls of text".
2. **Structural Variety**: Use "Pro-Tips", "Insider Secrets", and "Pull Quotes" to break up the flow.
3. **Sensory Storytelling**: Don't just list sights; describe the smell of rain on ancient stones, the vibration of a city, or the specific hue of a sunset.
4. **Professionalism**: Avoid clichés. Use sophisticated vocabulary. 
5. **Practicality**: Integrate cost-levels, specific local names, and 'know before you go' details.`;

const TRAVEL_BLOG_SYSTEM_PROMPT_TR = `Sen Tripzy için yazan, lüks bir seyahat ve yaşam tarzı dergisinin genel yayın yönetmenisin. Yazım tarzın sinematik, etkileyici ve son derece profesyonel.

**EDİTORYAL İLKELER:**
1. **Dinamik Tempo**: Kısa ve çarpıcı cümleleri akıcı tasvirlerle harmanla. ASLA büyük metin blokları kullanma.
2. **Yapısal Çeşitlilik**: Akışı bölmek için "Pro-İpuçları", "Yerel Sırlar" ve "Alıntı Blokları" kullan.
3. **Duyusal Hikaye Anlatımı**: Sadece görülecek yerleri listeleme; antik taşlardaki yağmur kokusunu, şehrin titreşimini veya gün batımının tam tonunu anlat.
4. **Profesyonellik**: Klişelerden kaçın. Seçkin bir kelime dağarcığı kullan.
5. **Pratiklik**: Maliyet seviyelerini, tam yerel isimleri ve gitmeden önce bilinmesi gereken detayları yazıya entegre et.`;

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

    **GÖREV / TASK**: Write a premium magazine-style feature article about "${
      params.destination
    }" in **${languageName}**.
    
    **STRICT DATA MODEL (JSON ONLY)**:
    Return a single JSON object with this exact structure:
    
    interface Response {
      title: string;
      excerpt: string;
      content: {
        sections: Array<{
          id: string;
          title: string;
          layoutType: 'standard' | 'high-impact' | 'practical';
          body: string; // HTML formatted
          proTip?: string; // High-visual tip box
          pullQuote?: string; // Large impact quote
          highlights?: string[]; // Bulleted feature list
          subsections?: Array<{
            id: string;
            title: string;
            body: string;
          }>;
        }>;
      };
      tags: string[];
      category: string;
      metaTitle: string;
      metaDescription: string;
    }

    **LAYOUT RULES**:
    1. **Paragraphs**: MAX 3 sentences per paragraph. This is CRITICAL for readability.
    2. **Rich Components**:
       - Use 'proTip' for specialized advice.
       - Use 'pullQuote' for highly evocative sentences.
       - Use 'highlights' for lists of must-sees.
    3. **Visuals**: Insert exactly ONE [IMAGE: descriptive prompt] placeholder in the 'body' of EVERY main section.
    4. **HTML Use**: Bold key terms using <strong>. Use <ul> for lists inside the body.
    
    **Context**:
    - Travel Style: ${params.travelStyle || "Luxury & Adventure"}
    - Target: ${params.targetAudience || "Sophisticated Travelers"}
    - Word Count: ~${params.wordCount || 1000} words.
    - Key Points: ${
      params.keyPoints?.join(", ") ||
      "Must-visit spots, local food, hidden gems"
    }

    Return ONLY raw JSON. No markdown blocks.
  `;
};

const convertCanonicalToHtml = (sections: any[]): string => {
  return sections
    .map((section) => {
      let html = `<section class="magazine-section section-${
        section.layoutType || "standard"
      }">`;

      // Section Title
      html += `<h2 id="${section.id}" class="magazine-h2">${section.title}</h2>\n`;

      // Pull Quote (Top position if high-impact)
      if (section.pullQuote) {
        html += `
          <blockquote class="magazine-pullquote">
            <p>${section.pullQuote}</p>
          </blockquote>
        `;
      }

      // Process Body
      let bodyText = section.body.trim();
      if (!bodyText.startsWith("<") && !bodyText.includes("<p>")) {
        bodyText = bodyText
          .split("\n\n")
          .map((p) => `<p>${p}</p>`)
          .join("\n");
      }

      // Structural replacements
      bodyText = bodyText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Keep [IMAGE: ...] markers as plain text - the editor will convert to upload blocks
      // No replacement needed - just leave them as is

      html += `<div class="magazine-body">${bodyText}</div>`;

      // Highlights
      if (section.highlights && section.highlights.length > 0) {
        html += `
          <div class="magazine-highlights">
            <h4 class="highlights-title">Highlights</h4>
            <ul>
              ${section.highlights.map((h: string) => `<li>${h}</li>`).join("")}
            </ul>
          </div>
        `;
      }

      // Pro Tip
      if (section.proTip) {
        html += `
          <div class="magazine-pro-tip">
            <div class="tip-icon">💡</div>
            <div class="tip-content">
              <strong>Insider Tip:</strong> ${section.proTip}
            </div>
          </div>
        `;
      }

      // Subsections
      if (section.subsections) {
        html += section.subsections
          .map((sub: any) => {
            let subBody = sub.body.trim();
            if (!subBody.startsWith("<") && !subBody.includes("<p>")) {
              subBody = subBody
                .split("\n\n")
                .map((p: string) => `<p>${p}</p>`)
                .join("\n");
            }
            return `<div class="magazine-subsection">
              <h3 id="${sub.id}" class="magazine-h3">${sub.title}</h3>
              <div class="subsection-body">${subBody}</div>
            </div>`;
          })
          .join("\n");
      }

      html += `</section>`;
      return html;
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

  async generatePostOutline(
    destination: string,
    language: "en" | "tr" = "en"
  ): Promise<any> {
    const prompt = `Generate a detailed post outline for a travel article about ${destination} in ${language}. 
    Return a JSON object with a 'sections' array, where each section has 'id', 'title', and 'summary'.`;
    const response = await callGemini(prompt);
    return parseJSON<any>(response);
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

  async generateSEO(title: string, content: string): Promise<SEOResult> {
    const prompt = `Generate SEO metaTitle, metaDescription, metaKeywords, and suggestedSlug as JSON for: ${title}\n\nContent: ${content.substring(
      0,
      1000
    )}`;
    const response = await callGemini(prompt);
    return parseJSON<SEOResult>(response);
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
    const prompt = `
      Act as a professional social media manager.
      Generate ${platform} content based on:
      
      Topic/Title: "${title}"
      Context/Details: "${content}"

      Return a strictly valid JSON object with the following keys:
      {
        "caption": "The post text (include emojis)",
        "hashtags": ["#tag1", "#tag2"],
        "suggestedPostTime": "e.g. Tuesday at 9:00 AM"
      }

      Return ONLY the JSON object. Do not include markdown formatting.
    `;
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
