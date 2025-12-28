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
  "content": "${isTurkish ? 'Markdown formatında ## başlıklarla tam makale içeriği' : 'Full article content in Markdown format with ## headings'}",
  "metaTitle": "${isTurkish ? '60 karakterin altında SEO optimize başlık' : 'SEO-optimized title under 60 characters'}",
  "metaDescription": "${isTurkish ? 'SEO meta açıklaması, 150-160 karakter' : 'SEO meta description, 150-160 characters'}",
  "metaKeywords": "${isTurkish ? 'virgülle, ayrılmış, anahtar, kelimeler' : 'comma, separated, keywords, for, seo'}",
  "suggestedCategory": "${isTurkish ? 'Şunlardan biri: Macera, Kültürel, Yeme-İçme, Lüks, Bütçe Dostu, Aile, Solo, Romantik, Wellness' : 'One of: Adventure, Cultural, Food & Drink, Luxury, Budget, Family, Solo, Romantic, Wellness'}",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;
};

// ... existing code ...

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
