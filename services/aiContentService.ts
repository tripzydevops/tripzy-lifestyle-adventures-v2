// services/aiContentService.ts
// Industry-leading AI Content Generation for Tripzy Travel Blog
// Designed to produce content rivaling Lonely Planet, Condé Nast Traveler, and Nomadic Matt
// Supports: Turkish (TR) and English (EN)

const getGeminiApiKey = () => {
  // 1. Check system environment (Vite/Build-time)
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey !== 'PLACEHOLDER_API_KEY' && envKey.length > 10) return envKey;
  
  // 2. Check localStorage (Runtime fallback for testing on deployed sites)
  try {
    const localKey = localStorage.getItem('TRIPZY_AI_KEY');
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
1. **Sensory Immersion**: Paint vivid pictures with specific sensory details - the aroma of spices in a Marrakech souk, the sound of temple bells in Kyoto, the texture of hand-woven textiles in Cusco
2. **Local Authenticity**: Include genuine local phrases, hidden gems only locals know, and cultural nuances that show deep destination knowledge
3. **Practical Value**: Every piece must include actionable tips - exact addresses, price ranges in local currency, best times to visit, insider booking strategies
4. **Emotional Resonance**: Connect travel experiences to universal human emotions - wonder, connection, growth, adventure
5. **SEO Excellence**: Naturally incorporate searchable terms while maintaining literary quality

**STRUCTURE:**
- Hook readers in the first 50 words with a compelling scene or provocative question
- Use varied sentence lengths for rhythm
- Include 2-3 subheadings per 500 words
- End with a memorable takeaway or call to action

**NEVER:**
- Use clichés like "hidden gem" or "off the beaten path" without earning them
- Make generic statements - always be specific
- Forget practical logistics readers need
- Write anything that feels like AI-generated content`;

const TRAVEL_BLOG_SYSTEM_PROMPT_TR = `Sen Tripzy için yazan dünya standartlarında bir seyahat yazarısın. Tripzy, premium bir seyahat ve yaşam tarzı platformudur. Yazım stilin şunları birleştiriyor:

**SES & TON:**
- Anthony Bourdain'in içeriden bilgisi
- Paul Theroux'nun hikaye anlatıcılığı ustalığı
- Rick Steves'in pratik bilgeliği
- Lonely Planet'in gezginlik ilhamı

**YAZIM İLKELERİ:**
1. **Duyusal Sürükleyicilik**: Belirli duyusal detaylarla canlı tablolar çiz - Marakeş çarşısındaki baharatların kokusu, Kyoto'daki tapınak çanlarının sesi, Cusco'daki el dokuması kumaşların dokusu
2. **Yerel Özgünlük**: Gerçek yerel deyimler, sadece yöre halkının bildiği gizli köşeler ve derin destinasyon bilgisi gösteren kültürel nüanslar ekle
3. **Pratik Değer**: Her yazı eyleme geçirilebilir ipuçları içermeli - tam adresler, yerel para biriminde fiyat aralıkları, ziyaret için en iyi zamanlar, içeriden rezervasyon stratejileri
4. **Duygusal Rezonans**: Seyahat deneyimlerini evrensel insan duygularına bağla - merak, bağlantı, gelişim, macera
5. **SEO Mükemmelliği**: Edebi kaliteyi korurken aranabilir terimleri doğal şekilde dahil et

**YAPI:**
- İlk 50 kelimede çekici bir sahne veya düşündürücü bir soruyla okuyucuları yakala
- Ritim için değişken cümle uzunlukları kullan
- Her 500 kelime için 2-3 alt başlık ekle
- Akılda kalıcı bir çıkarım veya eylem çağrısıyla bitir

**ASLA:**
- "Gizli hazine" veya "turistik olmayan" gibi klişeleri hak etmeden kullanma
- Genel ifadeler yapma - her zaman spesifik ol
- Okuyucuların ihtiyaç duyduğu pratik bilgileri unutma
- Yapay zeka tarafından üretilmiş hissettiren hiçbir şey yazma

**ÖNEMLİ:** Tüm içeriği akıcı, doğal Türkçe ile yaz. Çeviri gibi değil, Türk okuyucular için özel olarak yazılmış gibi olmalı.`;

const getSystemPrompt = (language: 'en' | 'tr') => {
  return language === 'tr' ? TRAVEL_BLOG_SYSTEM_PROMPT_TR : TRAVEL_BLOG_SYSTEM_PROMPT_EN;
};

const POST_GENERATION_PROMPT = (params: GeneratePostParams) => {
  const systemPrompt = getSystemPrompt(params.language || 'en');
  const isTurkish = params.language === 'tr';
  
  return `${systemPrompt}

**${isTurkish ? 'GÖREV' : 'ASSIGNMENT'}:** ${isTurkish ? `${params.destination} hakkında kapsamlı bir seyahat makalesi yaz.` : `Write a comprehensive travel article about ${params.destination}.`}

**${isTurkish ? 'PARAMETRELER' : 'PARAMETERS'}:**
- ${isTurkish ? 'Seyahat Stili' : 'Travel Style'}: ${params.travelStyle || (isTurkish ? 'Genel' : 'General')}
- ${isTurkish ? 'Hedef Kitle' : 'Target Audience'}: ${params.targetAudience || (isTurkish ? 'Otantik deneyimler arayan meraklı gezginler' : 'Curious travelers seeking authentic experiences')}
- ${isTurkish ? 'Kapsanacak Konular' : 'Key Topics to Cover'}: ${params.keyPoints?.join(', ') || (isTurkish ? 'En iyi mekanlar, yerel yemekler, pratik ipuçları' : 'Best attractions, local food, practical tips')}
- ${isTurkish ? 'Yaklaşık Uzunluk' : 'Approximate Length'}: ${params.wordCount || 1200} ${isTurkish ? 'kelime' : 'words'}
- ${isTurkish ? 'Ton' : 'Tone'}: ${params.tone || (isTurkish ? 'İlham verici ama pratik' : 'Inspiring yet practical')}

**${isTurkish ? 'GEREKLİ UNSURLAR' : 'REQUIRED ELEMENTS'}:**
${isTurkish ? `
1. Değer vaat eden ve merak uyandıran manyetik bir başlık
2. Okuyucuyu destinasyona taşıyan bir açılış kancası
3. Destinasyonun farklı yönlerini kapsayan 4-6 ayrı bölüm
4. Yaklaşık fiyatlarla en az 3 spesifik restoran/kafe önerisi
5. Farklı bütçeler için 2-3 konaklama önerisi
6. Temel pratik bilgiler: ziyaret için en iyi zaman, vize gereksinimleri, yerel adetler
7. İçeriden bilgi gösteren bir "Yöre Halkının Sırrı" ipucu
8. Eyleme ilham veren akılda kalıcı bir kapanış
` : `
1. A magnetic headline that promises value and creates curiosity
2. An opening hook that transports the reader to the destination
3. 4-6 distinct sections covering different aspects of the destination
4. At least 3 specific restaurant/cafe recommendations with approximate prices
5. 2-3 accommodation suggestions across different budgets
6. Essential practical info: best time to visit, visa requirements, local customs
7. A "Local's Secret" tip that shows insider knowledge
8. A memorable closing that inspires action
`}

**${isTurkish ? 'YANITINI JSON OLARAK FORMATLA' : 'FORMAT YOUR RESPONSE AS JSON'}:**
IMPORTANT: Ensure all newlines in JSON strings are properly escaped as \\n. Do not use literal newlines inside string values.
{
  "title": "${isTurkish ? 'Çekici Türkçe başlığınız' : 'Your compelling headline here'}",
  "excerpt": "${isTurkish ? 'Okuyucuları tıklamaya teşvik eden 150-160 karakterlik özet' : 'A 150-160 character summary that entices readers to click'}",
  "content": "${isTurkish ? 'HTML formatında (<h2>, <h3>, <p>, <ul>, <strong> etiketlerini kullan) tam makale içeriği. Markdown kullanma.' : 'Full article content in HTML format (use <h2>, <h3>, <p>, <ul>, <strong> tags). Do not use Markdown.'}",
  "metaTitle": "${isTurkish ? '60 karakterin altında SEO optimize başlık' : 'SEO-optimized title under 60 characters'}",
  "metaDescription": "${isTurkish ? 'SEO meta açıklaması, 150-160 karakter' : 'SEO meta description, 150-160 characters'}",
  "metaKeywords": "${isTurkish ? 'virgülle, ayrılmış, anahtar, kelimeler' : 'comma, separated, keywords, for, seo'}",
  "suggestedCategory": "${isTurkish ? 'Şunlardan biri: Macera, Kültürel, Yeme-İçme, Lüks, Bütçe Dostu, Aile, Solo, Romantik, Wellness' : 'One of: Adventure, Cultural, Food & Drink, Luxury, Budget, Family, Solo, Romantic, Wellness'}",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;
};

const EXCERPT_GENERATION_PROMPT = (content: string, language: 'en' | 'tr' = 'en') => {
  const isTurkish = language === 'tr';
  return `${getSystemPrompt(language)}

**${isTurkish ? 'GÖREV' : 'TASK'}:** ${isTurkish ? 'Aşağıdaki seyahat makalesi için çekici bir özet oluştur.' : 'Generate a compelling excerpt for the following travel article.'}

**${isTurkish ? 'GEREKSINIMLER' : 'REQUIREMENTS'}:**
- ${isTurkish ? 'Tam olarak 150-160 karakter' : 'Exactly 150-160 characters'}
- ${isTurkish ? 'Makalenin özünü ve benzersiz değerini yakala' : 'Capture the essence and unique value of the article'}
- ${isTurkish ? 'Merak uyandıran bir kancı ekle' : 'Include a hook that creates curiosity'}
- ${isTurkish ? 'Genel ifadelerden kaçın - bu içeriğe özgü ol' : 'Avoid generic phrases - be specific to this content'}

**${isTurkish ? 'MAKALE İÇERİĞİ' : 'ARTICLE CONTENT'}:**
${content.substring(0, 3000)}

**${isTurkish ? 'SADECE ÖZETİ YANITLA, tırnak işareti veya açıklama yok.' : 'RESPOND WITH ONLY THE EXCERPT, no quotes or explanation.'}**`;
};

const SEO_GENERATION_PROMPT = (title: string, content: string) => `
You are an SEO expert specializing in travel content. Analyze this article and generate optimized metadata.

**ARTICLE TITLE:** ${title}

**ARTICLE CONTENT (excerpt):**
${content.substring(0, 2000)}

**GENERATE:**
{
  "metaTitle": "SEO title, max 60 chars, include primary keyword",
  "metaDescription": "Compelling description, 150-160 chars, include CTA",
  "metaKeywords": "primary keyword, secondary keywords, long-tail variations (8-12 keywords)",
  "suggestedSlug": "url-friendly-slug-with-keywords"
}`;

const CONTENT_IMPROVEMENT_PROMPT = (content: string, instruction: string, language: 'en' | 'tr' = 'en') => {
  const isTurkish = language === 'tr';
  return `${getSystemPrompt(language)}

**${isTurkish ? 'GÖREV' : 'TASK'}:** ${isTurkish ? `Aşağıdaki seyahat içeriğini bu talimata göre geliştir: "${instruction}"` : `Improve the following travel content according to this instruction: "${instruction}"`}

**${isTurkish ? 'ORİJİNAL İÇERİK' : 'ORIGINAL CONTENT'}:**
${content}

**${isTurkish ? 'GELİŞTİRME KILAVUZU' : 'IMPROVEMENT GUIDELINES'}:**
- ${isTurkish ? 'Orijinal anlamı ve temel bilgileri koru' : 'Maintain the original meaning and key information'}
- ${isTurkish ? 'Düzyazı kalitesini ve okuyucu katılımını artır' : 'Enhance the prose quality and reader engagement'}
- ${isTurkish ? 'Uygun yerlerde duyusal detaylar ekle' : 'Add sensory details where appropriate'}
- ${isTurkish ? 'Geliştirilmiş versiyonun yayına hazır olduğundan emin ol' : 'Ensure the improved version is publication-ready'}
- ${isTurkish ? 'HTML formatında (<h2>, <p>, vb.) yanıt ver' : 'Respond in HTML format (using <h2>, <p>, etc.)'}

**${isTurkish ? 'SADECE GELİŞTİRİLMİŞ İÇERİĞİ YANITLA, açıklama veya meta veri yok.' : 'RESPOND WITH ONLY THE IMPROVED CONTENT, no explanation or metadata.'}**`;
};

const TITLE_SUGGESTIONS_PROMPT = (content: string, destination: string) => `
You are a headline expert for premium travel publications.

**CONTENT ABOUT:** ${destination}

**CONTENT EXCERPT:**
${content.substring(0, 1500)}

**GENERATE 5 HEADLINE OPTIONS:**
Each headline should:
- Be under 70 characters
- Create curiosity or promise value
- Include the destination name naturally
- Avoid clickbait while still compelling clicks

**RESPOND AS JSON ARRAY:**
["Headline 1", "Headline 2", "Headline 3", "Headline 4", "Headline 5"]`;

const SOCIAL_MEDIA_PROMPT = (title: string, content: string, platform: 'instagram' | 'twitter' | 'facebook') => `
You are a social media expert for luxury travel brands.

**ARTICLE:** ${title}

**CONTENT:**
${content.substring(0, 1500)}

**PLATFORM:** ${platform.toUpperCase()}

**REQUIREMENTS:**
${platform === 'instagram' ? `
- Write a captivating caption (max 2200 chars but aim for 150-200 for best engagement)
- Include 20-25 relevant hashtags organized by: location, travel style, general travel
- Add a call-to-action
- Include 1-2 relevant emojis at the start
` : platform === 'twitter' ? `
- Write a tweet under 280 characters
- Include 2-3 relevant hashtags
- Be witty, intriguing, or thought-provoking
- Include the article's key value proposition
` : `
- Write an engaging Facebook post
- 100-200 words for optimal engagement
- Include a question to encourage comments
- Add relevant emojis sparingly
`}

**FORMAT RESPONSE AS JSON:**
{
  "caption": "Your ${platform} post here",
  ${platform === 'instagram' ? '"hashtags": ["hashtag1", "hashtag2", ...],' : ''}
  "suggestedPostTime": "Best day/time to post"
}`;

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface GeneratePostParams {
  destination: string;
  language?: 'en' | 'tr';
  travelStyle?: 'Adventure' | 'Luxury' | 'Budget' | 'Cultural' | 'Food & Drink' | 'Family' | 'Solo' | 'Romantic' | 'Wellness';
  targetAudience?: string;
  keyPoints?: string[];
  wordCount?: 500 | 1000 | 1500 | 2000;
  tone?: 'Inspiring' | 'Practical' | 'Humorous' | 'Poetic' | 'Conversational';
}

export interface GeneratedPost {
  title: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  suggestedCategory: string;
  suggestedTags: string[];
}

export interface GeneratedSEO {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  suggestedSlug: string;
}

export interface GeneratedSocial {
  caption: string;
  hashtags?: string[];
  suggestedPostTime: string;
}

// ============================================================
// GEMINI API INTEGRATION
// ============================================================

async function callGemini(prompt: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env.local file.');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Invalid response from Gemini API');
  }

  return data.candidates[0].content.parts[0].text;
}

/**
 * Call Gemini with image data (Vision)
 */
async function callGeminiVision(prompt: string, base64Data: string, mimeType: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is not configured");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Vision API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Helper to fetch a remote image and convert to base64 for Gemini
 */
async function imageUrlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({ base64, mimeType: blob.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}  // Try to extract JSON from the response (Gemini sometimes wraps in markdown)



function parseJSON<T>(text: string): T {
  // Try to extract JSON from the response (Gemini sometimes wraps in markdown)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Attempt to fix common LLM JSON errors: unescaped newlines in strings
    try {
      const sanitizedStr = jsonStr.replace(/"((?:[^"\\]|\\.)*)"/g, (match, content) => {
        // Escape newlines, tabs, etc. inside string values
        const escaped = content
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `"${escaped}"`;
      });
      return JSON.parse(sanitizedStr);
    } catch (sanitizationError) {
      // If sanitization fails, fall back to regex extraction for partial recovery
      console.warn("JSON sanitization failed, trying regex extraction", sanitizationError);
    }

    // Try to find JSON-like content
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }
    
    throw new Error('Failed to parse AI response as JSON: ' + (e instanceof Error ? e.message : String(e)));
  }
}

// ============================================================
// EXPORTED SERVICE FUNCTIONS
// ============================================================

export const aiContentService = {
  /**
   * Generate a complete blog post from a destination and parameters
   */
  async generatePost(params: GeneratePostParams): Promise<GeneratedPost> {
    console.log('🚀 Generating travel post for:', params.destination);
    
    const prompt = POST_GENERATION_PROMPT(params);
    const response = await callGemini(prompt);
    
    try {
      const parsed = parseJSON<GeneratedPost>(response);
      console.log('✅ Post generated successfully');
      return parsed;
    } catch (error) {
       console.error("Failed to parse generated post:", response); // Log raw response for debugging
       throw error;
    }
  },

  /**
   * Generate an SEO-optimized excerpt from content
   */
  async generateExcerpt(content: string): Promise<string> {
    console.log('📝 Generating excerpt...');
    
    const prompt = EXCERPT_GENERATION_PROMPT(content);
    const response = await callGemini(prompt);
    
    // Clean up the response
    const excerpt = response.replace(/^["']|["']$/g, '').trim();
    
    console.log('✅ Excerpt generated:', excerpt.substring(0, 50) + '...');
    return excerpt;
  },

  /**
   * Generate SEO metadata from title and content
   */
  async generateSEO(title: string, content: string): Promise<GeneratedSEO> {
    console.log('🔍 Generating SEO metadata...');
    
    const prompt = SEO_GENERATION_PROMPT(title, content);
    const response = await callGemini(prompt);
    const parsed = parseJSON<GeneratedSEO>(response);
    
    console.log('✅ SEO metadata generated');
    return parsed;
  },

  /**
   * Improve existing content based on an instruction
   */
  async improveContent(content: string, instruction: string): Promise<string> {
    console.log('✨ Improving content with instruction:', instruction);
    
    const prompt = CONTENT_IMPROVEMENT_PROMPT(content, instruction);
    const response = await callGemini(prompt);
    
    console.log('✅ Content improved');
    return response.trim();
  },

  /**
   * Generate title suggestions from content
   */
  async generateTitleSuggestions(content: string, destination: string): Promise<string[]> {
    console.log('💡 Generating title suggestions...');
    
    const prompt = TITLE_SUGGESTIONS_PROMPT(content, destination);
    const response = await callGemini(prompt);
    const titles = parseJSON<string[]>(response);
    
    console.log('✅ Generated', titles.length, 'title suggestions');
    return titles;
  },

  /**
   * Generate social media content from a blog post
   */
  async generateSocialContent(
    title: string, 
    content: string, 
    platform: 'instagram' | 'twitter' | 'facebook'
  ): Promise<GeneratedSocial> {
    console.log(`📱 Generating ${platform} content...`);
    
    const prompt = SOCIAL_MEDIA_PROMPT(title, content, platform);
    const response = await callGemini(prompt);
    const parsed = parseJSON<GeneratedSocial>(response);
    
    console.log(`✅ ${platform} content generated`);
    return parsed;
  },

  /**
   * Generate an outline for a blog post
   */
  async generatePostOutline(title: string): Promise<string> {
    console.log('📝 Generating outline for:', title);
    
    const prompt = `Create a comprehensive, structured travel blog post outline for the title: "${title}". 
    Include suggestions for H2/H3 headings, key points to cover, and cultural nuances. 
    Format as a clean Markdown list.`;
    
    const response = await callGemini(prompt);
    console.log('✅ Outline generated');
    return response.trim();
  },

  /**
   * Analyze an image from a URL and generate descriptive metadata
   */
  async analyzeImageFromUrl(url: string): Promise<{ altText: string; caption: string }> {
    console.log('👁️ Analyzing image from URL...');
    try {
      const { base64, mimeType } = await imageUrlToBase64(url);
      const prompt = `Act as an expert travel photography archivist. Analyze this image and provide:
      1. A concise, SEO-friendly alt text (max 120 chars).
      2. A descriptive, engaging caption for a travel blog (1-2 sentences).
      
      Return the result as a raw JSON object like this:
      {"altText": "...", "caption": "..."}`;
      
      const response = await callGeminiVision(prompt, base64, mimeType);
      return parseJSON<{ altText: string; caption: string }>(response);
    } catch (error) {
      console.error('Image analysis failed:', error);
      return { 
        altText: "Travel destination", 
        caption: "A beautiful view from our trip." 
      };
    }
  },

  /**
   * Check if the AI service is properly configured
   */
  isConfigured(): boolean {
    return !!getGeminiApiKey();
  }
};

export default aiContentService;
