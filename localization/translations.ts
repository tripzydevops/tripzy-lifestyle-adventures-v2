// Localization system for Tripzy Lifestyle Adventures Blog
// English and Turkish translations

export type Language = "en" | "tr";

export interface Translations {
  // Header & Navigation
  header: {
    home: string;
    tripPlanner: string;
    about: string;
    contact: string;
    login: string;
    tripzyDeals: string;
  };
  // Homepage
  homepage: {
    heroBadge: string;
    heroTitle1: string;
    heroTitle2: string;
    heroSubtitle: string;
    exploreStories: string;
    findDeals: string;
    latestStories: string;
    videoSeries: string;
    watchOurAdventures: string;
    videoSubtitle: string;
    viewAllVideos: string;
  };
  // Footer
  footer: {
    tagline: string;
    about: string;
    aboutText: string;
    quickLinks: string;
    followUs: string;
    newsletter: string;
    newsletterText: string;
    emailPlaceholder: string;
    subscribe: string;
    copyright: string;
  };
  // Trip Planner Page
  tripPlanner: {
    badge: string;
    title: string;
    subtitle: string;
    destinationPlaceholder: string;
    duration: string;
    days: string;
    generateButton: string;
    planning: string;
    localInsightsTitle: string;
    localInsightsDesc: string;
    mapGroundingTitle: string;
    mapGroundingDesc: string;
    personalizedTitle: string;
    personalizedDesc: string;
    buildingTrip: string;
    buildingTripDesc: string;
    yourTrip: string;
    generatedBy: string;
    verifiedLocations: string;
    viewOnMaps: string;
    travelTip: string;
    travelTipText: string;
  };
  // Blog
  blog: {
    readMore: string;
    relatedPosts: string;
    leaveComment: string;
    yourName: string;
    yourEmail: string;
    yourComment: string;
    submitComment: string;
    comments: string;
    noComments: string;
    shareArticle: string;
    categories: string;
    tags: string;
    by: string;
    on: string;
    min: string;
    readTime: string;
    views: string;
  };
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    search: string;
    searchPlaceholder: string;
    processing: string;
  };
  // Login Page
  login: {
    title: string;
    subtitle: string;
    googleButton: string;
    or: string;
    emailLabel: string;
    passwordLabel: string;
    submitButton: string;
    backToWebsite: string;
    errorEmpty: string;
    errorFailedGoogle: string;
  };
  // Search
  search: {
    resultsFor: string;
    noResults: string;
    noResultsSub: string;
    aiOverview: string;
    aiOverviewError: string;
    blogResults: string;
  };
  // About Page
  about: {
    title: string;
    mission: string;
    missionText: string;
    story: string;
    storyText: string;
    stats: {
      destinations: string;
      readers: string;
      guides: string;
    };
  };
  // Contact Page
  contact: {
    title: string;
    subtitle: string;
    formTitle: string;
    nameLabel: string;
    emailLabel: string;
    messageLabel: string;
    submitButton: string;
    submitting: string;
    success: string;
    info: {
      email: string;
      phone: string;
      address: string;
    };
  };
  // Admin Panel
  admin: {
    managePosts: string;
    manageMedia: string;
    newPost: string;
    newMedia: string;
    noMedia: string;
    editPost: string;
    title: string;
    author: string;
    status: string;
    date: string;
    actions: string;
    noPosts: string;
    createFirst: string;
    deleteConfirm: string;
    deleteSuccess: string;
    saveSuccess: string;
    form: {
      postTitle: string;
      postExcerpt: string;
      postContent: string;
      category: string;
      tags: string;
      featuredImage: string;
      status: string;
      youtubeUrl: string;
      metaInformation: string;
      metaTitle: string;
      metaDescription: string;
      publishing: string;
      publishedAt: string;
      metaKeywords: string;
    };
    settings: {
      title: string;
      subtitle: string;
      general: string;
      branding: string;
      platformName: string;
      tagline: string;
      appearance: string;
      designSystem: string;
      primaryAccents: string;
      typographyHeadings: string;
      typographyBody: string;
      socialGraph: string;
      socialHeadline: string;
      socialDesc: string;
      shareImageUrl: string;
      commitChanges: string;
      synchronizing: string;
    };
    profile: {
      title: string;
      subtitle: string;
      fullName: string;
      photoUrl: string;
      saveProfile: string;
    };
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    header: {
      home: "Home",
      tripPlanner: "Trip Planner",
      about: "About",
      contact: "Contact",
      login: "Login",
      tripzyDeals: "Tripzy Deals",
    },
    homepage: {
      heroBadge: "Your Travel Adventure Starts Here",
      heroTitle1: "Live Your ",
      heroTitle2: "Adventure",
      heroSubtitle:
        "Discover stories, tips, and guides from our travels across the globe.",
      exploreStories: "Explore Stories",
      findDeals: "Find Deals on Tripzy",
      latestStories: "Latest Stories",
      videoSeries: "Video Travel Series",
      watchOurAdventures: "Watch Our Adventures",
      videoSubtitle: "Travel vlogs, guides, and destination highlights",
      viewAllVideos: "View All Videos",
    },
    footer: {
      tagline: "Where every journey becomes a lifestyle",
      about: "About",
      aboutText:
        "Tripzy Lifestyle Adventures is your gateway to discovering the world. From hidden gems to popular destinations, we help you plan unforgettable journeys with AI-powered insights.",
      quickLinks: "Quick Links",
      followUs: "Follow Us",
      newsletter: "Newsletter",
      newsletterText:
        "Get travel tips and exclusive deals delivered to your inbox",
      emailPlaceholder: "Enter your email",
      subscribe: "Subscribe",
      copyright: "© 2025 Tripzy Lifestyle Adventures. All rights reserved.",
    },
    tripPlanner: {
      badge: "AI Powered Planning",
      title: "Where will your next",
      subtitle:
        "Our AI travel consultant uses real-time Google data to build the perfect day-by-day itinerary just for you.",
      destinationPlaceholder: "e.g., Tokyo, Japan",
      duration: "Duration",
      days: "Days",
      generateButton: "Generate Itinerary",
      planning: "Planning...",
      localInsightsTitle: "Local Insights",
      localInsightsDesc: "Hidden gems suggested by real-time web searches.",
      mapGroundingTitle: "Map Grounding",
      mapGroundingDesc: "Direct links to verified Google Maps locations.",
      personalizedTitle: "Personalized",
      personalizedDesc: "Tailored day-by-day flows for your time frame.",
      buildingTrip: "Building your dream trip...",
      buildingTripDesc:
        "Gemini is currently cross-referencing maps, reviews, and latest travel guides to find the best spots in",
      yourTrip: "Your",
      generatedBy: "Generated by Gemini Intelligence",
      verifiedLocations: "Verified Locations",
      viewOnMaps: "View on Google Maps",
      travelTip: "Travel Tip",
      travelTipText:
        "Always check local opening hours as they may vary seasonally. This itinerary is live-generated based on current top-rated data.",
    },
    blog: {
      readMore: "Read More",
      relatedPosts: "Related Posts",
      leaveComment: "Leave a Comment",
      yourName: "Your Name",
      yourEmail: "Your Email",
      yourComment: "Your Comment",
      submitComment: "Submit Comment",
      comments: "Comments",
      noComments: "No comments yet. Be the first to comment!",
      shareArticle: "Share this article",
      categories: "Categories",
      tags: "Tags",
      by: "by",
      on: "on",
      min: "min",
      readTime: "read",
      views: "views",
    },
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      search: "Search",
      searchPlaceholder: "Search posts...",
      processing: "Processing...",
    },
    login: {
      title: "Tripzy Lifestyle",
      subtitle: "Welcome back, Traveler",
      googleButton: "Continue with Google",
      or: "OR",
      emailLabel: "Email Address",
      passwordLabel: "Password",
      submitButton: "Sign In to Dashboard",
      backToWebsite: "Back to website",
      errorEmpty: "Please enter both email and password.",
      errorFailedGoogle: "Failed to sign in with Google.",
    },
    search: {
      resultsFor: "Results for:",
      noResults: "No blog posts found.",
      noResultsSub:
        'Try searching for keywords like "Italy", "Kyoto", or "Adventure".',
      aiOverview: "Gemini AI Overview",
      aiOverviewError: "Could not generate AI overview for this query.",
      blogResults: "Blog Results",
    },
    about: {
      title: "Our Story & Mission",
      mission: "Our Mission",
      missionText:
        "Our mission is to inspire and empower you to explore the world. Through our detailed guides, personal stories, and practical tips, we aim to make travel more accessible and enjoyable for everyone.",
      story: "Our Story",
      storyText:
        "Tripzy Lifestyle Adventures started as a small personal blog to document our own journeys. It has since grown into a community of passionate travelers who share a love for adventure and discovery.",
      stats: {
        destinations: "Destinations Explored",
        readers: "Monthly Readers",
        guides: "Travel Guides",
      },
    },
    contact: {
      title: "Get In Touch",
      subtitle:
        "Have a question, suggestion, or just want to say hello? We'd love to hear from you!",
      formTitle: "Send us a Message",
      nameLabel: "Full Name",
      emailLabel: "Email Address",
      messageLabel: "Message",
      submitButton: "Submit Message",
      submitting: "Submitting...",
      success: "Your message has been sent successfully!",
      info: {
        email: "Email",
        phone: "Phone",
        address: "Address",
      },
    },
    admin: {
      managePosts: "Manage Posts",
      manageMedia: "Manage Media",
      newPost: "New Post",
      newMedia: "Add New Media",
      noMedia: "No media found. Start by uploading your first asset.",
      editPost: "Edit Post",
      title: "Title",
      author: "Author",
      status: "Status",
      date: "Date",
      actions: "Actions",
      noPosts: "No posts found.",
      createFirst: "Create your first story!",
      deleteConfirm:
        "Are you sure you want to delete this story? This action cannot be undone.",
      deleteSuccess: "Story deleted successfully",
      saveSuccess: "Story saved successfully",
      form: {
        postTitle: "Story Title",
        postExcerpt: "Short Excerpt",
        postContent: "Full Story Content",
        category: "Category",
        tags: "Tags (comma separated)",
        featuredImage: "Featured Image URL",
        status: "Publishing Status",
        youtubeUrl: "YouTube Video URL (Optional)",
        metaInformation: "SEO & Meta Information",
        metaTitle: "Meta Title",
        metaDescription: "Meta Description",
        publishing: "Publishing Settings",
        publishedAt: "Publication Date",
        metaKeywords: "Meta Keywords",
      },
      settings: {
        title: "System Configuration",
        subtitle:
          "Fine-tune your Tripzy platform's core identity and performance.",
        general: "General",
        branding: "General Branding",
        platformName: "Platform Name",
        tagline: "Brand Tagline",
        appearance: "Appearance",
        designSystem: "Visual Design System",
        primaryAccents: "Primary Accents",
        typographyHeadings: "Typography (Headings)",
        typographyBody: "Typography (Body)",
        socialGraph: "Social Graph & Discovery",
        socialHeadline: "OG Title (Social Headline)",
        socialDesc: "OG Description",
        shareImageUrl: "Share Image URL",
        commitChanges: "Commit Changes",
        synchronizing: "Synchronizing...",
      },
      profile: {
        title: "Executive Profile",
        subtitle: "Manage your administrative identity and credentials.",
        fullName: "Full Name",
        photoUrl: "Profile Photo (URL)",
        saveProfile: "Save Profile",
      },
    },
  },
  tr: {
    header: {
      home: "Ana Sayfa",
      tripPlanner: "Gezi Planlayıcı",
      about: "Hakkında",
      contact: "İletişim",
      login: "Giriş",
      tripzyDeals: "Tripzy Fırsatlar",
    },
    homepage: {
      heroBadge: "Seyahat Maceranız Burada Başlıyor",
      heroTitle1: "Macereni ",
      heroTitle2: "Yaşa",
      heroSubtitle:
        "Dünya genelindeki seyahatlerimizden hikayeler, ipuçları ve rehberler keşfedin.",
      exploreStories: "Hikayeleri Keşfet",
      findDeals: "Tripzy'da Fırsat Bul",
      latestStories: "Son Hikayeler",
      videoSeries: "Video Seyahat Serisi",
      watchOurAdventures: "Maceralarımızı İzleyin",
      videoSubtitle: "Seyahat vlogları, rehberler ve destinasyon özetleri",
      viewAllVideos: "Tüm Videoları Görüntüle",
    },
    footer: {
      tagline: "Her yolculuk bir yaşam tarzı",
      about: "Hakkında",
      aboutText:
        "Tripzy Lifestyle Adventures, dünyayı keşfetmeniz için kapınızdır. Gizli cennetlerden popüler destinasyonlara kadar yapay zeka destekli önerilerle unutulmaz yolculuklar planlamanıza yardımcı oluyoruz.",
      quickLinks: "Hızlı Bağlantılar",
      followUs: "Takip Edin",
      newsletter: "Bülten",
      newsletterText: "Seyahat ipuçları ve özel fırsatları e-postanıza alın",
      emailPlaceholder: "E-postanızı girin",
      subscribe: "Abone Ol",
      copyright: "© 2025 Tripzy Lifestyle Adventures. Tüm hakları saklıdır.",
    },
    tripPlanner: {
      badge: "Yapay Zeka Destekli Planlama",
      title: "Bir sonraki",
      subtitle:
        "Yapay zeka seyahat danışmanımız, sizin için mükemmel günlük program oluşturmak üzere Google'ın gerçek zamanlı verilerini kullanır.",
      destinationPlaceholder: "örn., Tokyo, Japonya",
      duration: "Süre",
      days: "Gün",
      generateButton: "Program Oluştur",
      planning: "Planlanıyor...",
      localInsightsTitle: "Yerel İpuçları",
      localInsightsDesc:
        "Gerçek zamanlı web aramalarıyla önerilen gizli cennetler.",
      mapGroundingTitle: "Harita Doğrulama",
      mapGroundingDesc:
        "Doğrulanmış Google Maps konumlarına doğrudan bağlantılar.",
      personalizedTitle: "Kişiselleştirilmiş",
      personalizedDesc: "Zaman diliminize göre özelleştirilmiş günlük akışlar.",
      buildingTrip: "Hayalinizdeki gezi oluşturuluyor...",
      buildingTripDesc:
        "Gemini şu anda haritaları, yorumları ve en güncel seyahat rehberlerini karşılaştırarak",
      yourTrip: "Sizin",
      generatedBy: "Gemini Intelligence tarafından oluşturuldu",
      verifiedLocations: "Doğrulanmış Konumlar",
      viewOnMaps: "Google Maps'te Görüntüle",
      travelTip: "Seyahat İpucu",
      travelTipText:
        "Açılış saatleri mevsimsel olarak değişebileceğinden her zaman yerel saatleri kontrol edin. Bu program, güncel en yüksek puanlı verilere göre canlı olarak oluşturulmuştur.",
    },
    blog: {
      readMore: "Devamını Oku",
      relatedPosts: "İlgili Yazılar",
      leaveComment: "Yorum Yap",
      yourName: "Adınız",
      yourEmail: "E-postanız",
      yourComment: "Yorumunuz",
      submitComment: "Yorum Gönder",
      comments: "Yorumlar",
      noComments: "Henüz yorum yok. İlk yorumu siz yapın!",
      shareArticle: "Bu yazıyı paylaş",
      categories: "Kategoriler",
      tags: "Etiketler",
      by: "yazar",
      on: "tarih",
      min: "dk",
      readTime: "okuma",
      views: "görüntülenme",
    },
    common: {
      loading: "Yükleniyor...",
      error: "Hata",
      success: "Başarılı",
      cancel: "İptal",
      save: "Kaydet",
      delete: "Sil",
      edit: "Düzenle",
      search: "Ara",
      searchPlaceholder: "Yazı ara...",
      processing: "İşleniyor...",
    },
    login: {
      title: "Tripzy Lifestyle",
      subtitle: "Hoş geldiniz, Gezgin",
      googleButton: "Google ile Devam Et",
      or: "VEYA",
      emailLabel: "E-posta Adresi",
      passwordLabel: "Şifre",
      submitButton: "Panele Giriş Yap",
      backToWebsite: "Web sitesine dön",
      errorEmpty: "Lütfen hem e-posta hem de şifre girin.",
      errorFailedGoogle: "Google ile giriş yapılamadı.",
    },
    search: {
      resultsFor: "Sonuçlar:",
      noResults: "Blog yazısı bulunamadı.",
      noResultsSub:
        '"İtalya", "Kyoto" veya "Macera" gibi anahtar kelimeleri aramayı deneyin.',
      aiOverview: "Gemini Yapay Zeka Özeti",
      aiOverviewError: "Bu sorgu için yapay zeka özeti oluşturulamadı.",
      blogResults: "Blog Sonuçları",
    },
    about: {
      title: "Hikayemiz ve Misyonumuz",
      mission: "Misyonumuz",
      missionText:
        "Misyonumuz, dünyayı keşfetmeniz için size ilham vermek ve sizi güçlendirmektir. Detaylı rehberlerimiz, kişisel hikayelerimiz ve pratik ipuçlarımızla, seyahati herkes için daha erişilebilir ve keyifli hale getirmeyi hedefliyoruz.",
      story: "Hikayemiz",
      storyText:
        "Tripzy Lifestyle Adventures, kendi yolculuklarımızı belgelemek için küçük bir kişisel blog olarak başladı. O zamandan beri, macera ve keşif sevgisini paylaşan tutkulu gezginlerden oluşan bir topluluğa dönüştü.",
      stats: {
        destinations: "Keşfedilen Destinasyonlar",
        readers: "Aylık Okuyucu",
        guides: "Seyahat Rehberi",
      },
    },
    contact: {
      title: "İletişime Geçin",
      subtitle:
        "Bir sorunuz, öneriniz mi var yoksa sadece merhaba mı demek istiyorsunuz? Sizden haber almayı çok isteriz!",
      formTitle: "Bize Mesaj Gönderin",
      nameLabel: "Ad Soyad",
      emailLabel: "E-posta Adresi",
      messageLabel: "Mesajınız",
      submitButton: "Mesaj Gönder",
      submitting: "Gönderiliyor...",
      success: "Mesajınız başarıyla gönderildi!",
      info: {
        email: "E-posta",
        phone: "Telefon",
        address: "Adres",
      },
    },
    admin: {
      managePosts: "Yazıları Yönet",
      manageMedia: "Medyayı Yönet",
      newPost: "Yeni Yazı",
      newMedia: "Yeni Medya Ekle",
      noMedia: "Medya bulunamadı. İlk dosyanızı yükleyerek başlayın.",
      editPost: "Yazıyı Düzenle",
      title: "Başlık",
      author: "Yazar",
      status: "Durum",
      date: "Tarih",
      actions: "İşlemler",
      noPosts: "Yazı bulunamadı.",
      createFirst: "İlk hikayenizi oluşturun!",
      deleteConfirm:
        "Bu hikayeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
      deleteSuccess: "Hikaye başarıyla silindi",
      saveSuccess: "Hikaye başarıyla kaydedildi",
      form: {
        postTitle: "Hikaye Başlığı",
        postExcerpt: "Kısa Özet",
        postContent: "Tüm Hikaye İçeriği",
        category: "Kategori",
        tags: "Etiketler (virgülle ayırın)",
        featuredImage: "Öne Çıkan Görsel URL",
        status: "Yayın Durumu",
        youtubeUrl: "YouTube Video URL (Opsiyonel)",
        metaInformation: "SEO ve Meta Bilgileri",
        metaTitle: "Meta Başlığı",
        metaDescription: "Meta Açıklaması",
        publishing: "Yayınlama Ayarları",
        publishedAt: "Yayınlanma Tarihi",
        metaKeywords: "Meta Anahtar Kelimeler",
      },
      settings: {
        title: "Sistem Yapılandırması",
        subtitle:
          "Tripzy platformunuzun temel kimliğini ve performansını hassaslaştırın.",
        general: "Genel",
        branding: "Genel Markalama",
        platformName: "Platform Adı",
        tagline: "Marka Sloganı",
        appearance: "Görünüm",
        designSystem: "Görsel Tasarım Sistemi",
        primaryAccents: "Birincil Vurgular",
        typographyHeadings: "Tipografi (Başlıklar)",
        typographyBody: "Tipografi (Gövde)",
        socialGraph: "Sosyal Grafik ve Keşif",
        socialHeadline: "OG Başlığı (Sosyal Başlık)",
        socialDesc: "OG Açıklaması",
        shareImageUrl: "Paylaşım Görseli URL'si",
        commitChanges: "Değişiklikleri Kaydet",
        synchronizing: "Senkronize ediliyor...",
      },
      profile: {
        title: "Yönetici Profili",
        subtitle: "Yönetici kimliğinizi ve kimlik bilgilerinizi yönetin.",
        fullName: "Tam Ad",
        photoUrl: "Profil Fotoğrafı (URL)",
        saveProfile: "Profili Kaydet",
      },
    },
  },
};
