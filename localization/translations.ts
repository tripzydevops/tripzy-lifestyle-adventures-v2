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
    mediaSubtitle: string; // New
    noMedia: string;
    uploadSuccess: string; // New
    uploadError: string; // New
    loadError: string; // New
    uploadFirst: string; // New
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
    viewLive: string; // New
    selectFeatured: string; // New
    altText: string; // New
    altPlaceholder: string; // New
    saveDraft: string;
    schedule: string;
    submitReview: string;
    publishNow: string;
    aiExcerpt: string;
    aiKeywords: string;
    aiNarrative: string;
    seoConfig: string;
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
    placeholder: {
      title: string;
      excerpt: string;
      metaKeywords: string;
    };
    ai: {
      generating: string;
      generatingImage: string;
      imageUpgrade: string;
      createSubtitle: string;
      improveProse: string;
      translateTurkish: string;
      generateOutline: string;
      narrativeGuidelines: string;
      dismissSuggestions: string;
      generateFeaturedImage: string;
      seoDiscovery: string;
      aiExcerptLabel: string;
      aiKeywordsLabel: string;
    };

    // New Media Library Keys
    mediaLibrary: string;
    unsplash: string;
    library: string;
    searchMediaPlaceholder: string;
    searchUnsplashPlaceholder: string;
    uploading: string;
    upload: string;
    import: string;
    desertsFound: string;
    exploreWorld: string;
    searchArchivesEmpty: string;
    searchUnsplashEmpty: string;
    accessingArchives: string;
    searchingWorld: string;

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
      backupExport: string;
      exportPosts: string;
      exportComments: string;
      exportSubscribers: string;
      exportMedia: string;
    };
    profile: {
      title: string;
      subtitle: string;
      fullName: string;
      photoUrl: string;
      saveProfile: string;
      saving: string;
      currentLevel: string;
      toNextLevel: string;
      achievements: string;
    };
    dashboard: {
      welcomeBack: string;
      monitoringText: string;
      systemOnline: string;
      errorTitle: string;
      retry: string;
      commonIssues: string;
      issueCredentials: string;
      issueSchema: string;
      issueMigration: string;
      issueConsole: string;
      activeStories: string;
      totalExplorers: string;
      underReview: string;
      editorialDrafts: string;
      quickActions: string;
      newAdventure: string;
      contentManager: string;
      liveSite: string;
      importViralPost: string;
      autonomousTip: string;
      tipText: string;
      topPerforming: string;
      sortByViews: string;
      views: string;
      importSuccess: string;
      performance: string;
    };
    media: {
      manageMedia: string;
      mediaSubtitle: string;
      newMedia: string;
      searchMedia: string;
      noMediaFound: string;
      dragDropText: string;
      uploadFirst: string;
      importMedia: string;
      importSubtitle: string;
      pasteUrl: string;
      bridging: string;
      importToLibrary: string;
      previewAppeared: string;
      uploadSuccess: string;
      uploadFailed: string;
      urlCopied: string;
      imagesAndVideos: string;
      uploading: string;
      allTags: string;
      copyUrl: string;
      openOriginal: string;
      delete: string;
      preview: string;
      filename: string;
      type: string;
      tags: string;
      size: string;
      actions: string;
      dropToUpload: string;
      types: {
        all: string;
        image: string;
        video: string;
      };
    };
    users: {
      manageCommunity: string;
      communitySubtitle: string;
      totalUsersText: string;
      updateAuthority: string;
      unban: string;
      ban: string;
      banned: string;
      roles: {
        admin: string;
        editor: string;
        author: string;
      };
      email: string;
      role: string;
      user: string;
      control: string;
      fetchError: string;
      updateSuccess: string;
      updateError: string;
      banSuccess: string;
      unbanSuccess: string;
      statusError: string;
    };
    comments: {
      title: string;
      subtitle: string;
      pending: string;
      approve: string;
      delete: string;
      viewPost: string;
      empty: string;
      emptySubtitle: string;
    };
    newsletter: string;
    newsletterSubtitle: string;
    manageUsers: string;
    user: string;
    email: string;
    role: string;
    maps: {
      title: string;
      addMap: string;
      editMap: string;
      mapName: string;
      mapType: string;
      markers: string;
      route: string;
      polygon: string;
      centerLat: string;
      centerLng: string;
      zoom: string;
      saveMap: string;
      deleteMap: string;
      clickToPlace: string;
      loadError: string;
      loading: string;
      noMaps: string;
      namePlaceholder: string;
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
      mediaSubtitle: "Manage your visual assets and storytelling resources.",
      noMedia: "No media found. Start by uploading your first asset.",
      uploadSuccess: "Media uploaded successfully!",
      uploadError: "Media upload failed.",
      loadError: "Failed to load media.",
      uploadFirst: "Start by uploading your first asset",

      mediaLibrary: "Media Library",
      unsplash: "Unsplash",
      library: "Library",
      searchMediaPlaceholder: "Search files...",
      searchUnsplashPlaceholder: "Search Unsplash...",
      uploading: "Uploading...",
      upload: "Upload",
      import: "Import",
      desertsFound: "Deserts were found...",
      exploreWorld: "Explore the World",
      searchArchivesEmpty:
        'No files matching "{query}" in your current expedition archives.',
      searchUnsplashEmpty:
        "Search for high-quality travel photography from Unsplash freely.",
      accessingArchives: "Accessing travel archives...",
      searchingWorld: "Searching global photography...",
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
      deleteSuccess: "Item deleted successfully.",
      saveSuccess: "Changes saved successfully.",
      viewLive: "View Live Post", // New
      selectFeatured: "Select Featured Media", // New
      altText: "Alt Text", // New
      altPlaceholder: "Describe the media for accessibility", // New
      saveDraft: "Save Draft",
      schedule: "Schedule",
      submitReview: "Submit For Review",
      publishNow: "Publish Now",
      aiExcerpt: "AI Excerpt",
      aiKeywords: "AI Keywords",
      aiNarrative: "AI Narrative Guidelines",
      seoConfig: "SEO & Discovery Configuration",
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
        backupExport: "Backup & Export", // New
        exportPosts: "Export Posts (JSON)", // New
        exportComments: "Export Comments", // New
        exportSubscribers: "Export Subscribers", // New
        exportMedia: "Export Media List", // New
      },
      profile: {
        title: "Executive Profile",
        subtitle: "Manage your administrative identity and credentials.",
        fullName: "Full Name",
        photoUrl: "Profile Photo (URL)",
        saveProfile: "Save Profile",
        saving: "Saving...", // New
        currentLevel: "Current Level", // New
        toNextLevel: "To Next Level", // New
        achievements: "Achievements", // New
      },
      dashboard: {
        welcomeBack: "Welcome back,",
        monitoringText:
          "Monitoring Tripzy Lifestyle Adventures platform health and content performance.",
        systemOnline: "System Online",
        errorTitle: "Dashboard Error",
        retry: "Retry",
        commonIssues: "Common issues:",
        issueCredentials:
          "Check that your Supabase credentials in .env.local are correct",
        issueSchema:
          "Verify that the 'blog' schema exists in your Supabase database",
        issueMigration: "Ensure you've run the migration scripts",
        issueConsole: "Check browser console for detailed error messages",
        activeStories: "Active Stories",
        totalExplorers: "Total Explorers",
        underReview: "Under Review",
        editorialDrafts: "Editorial Drafts",
        quickActions: "Quick Actions",
        newAdventure: "New Adventure",
        contentManager: "Content Manager",
        liveSite: "Live Site",
        importViralPost: "Import Viral Post",
        autonomousTip: "Autonomous Tip",
        tipText:
          '"Travelers are searching more for hidden local gems in Tokyo. Consider highlighting more independent cafes in your next guide."',
        topPerforming: "Top Performing Stories",
        sortByViews: "Sort by Views",
        views: "Views",
        importSuccess: "Viral post imported successfully!",
        performance: "Signal Intelligence",
      },
      comments: {
        title: "Comment Moderation",
        subtitle: "Review and approve pending comments from users.",
        pending: "Pending",
        approve: "Approve",
        delete: "Delete",
        viewPost: "View Post",
        empty: "All Caught Up!",
        emptySubtitle: "No pending comments to review.",
      },
      newsletter: "Newsletter Subscribers",
      newsletterSubtitle: "Manage and export your loyal audience.",
      manageUsers: "Manage Users",
      user: "User",
      email: "Email",
      role: "Role",
      media: {
        manageMedia: "Media Library",
        mediaSubtitle:
          "Curate your visual story through images and cinematic clips.",
        newMedia: "Upload Assets",
        searchMedia: "Search by filename or tags...",
        noMediaFound: "No media found in your archives.",
        dragDropText:
          "Drag and drop files here, or click the button above to start building your library.",
        uploadFirst: "Upload your first asset",
        importMedia: "External Bridge",
        importSubtitle:
          "Fetch media directly from external travel sources and CDNs.",
        pasteUrl:
          "Paste the direct URL of an image or video to bridge it into your Tripzy media library.",
        bridging: "Safely Bridging...",
        importToLibrary: "Import to Library",
        previewAppeared: "Preview will appear here after a successful bridge.",
        uploadSuccess: "{count} file(s) uploaded successfully",
        uploadFailed: "Upload failed",
        urlCopied: "URL copied to clipboard",
        imagesAndVideos: "Images and Videos",
        uploading: "Uploading",
        allTags: "All Tags",
        copyUrl: "Copy URL",
        openOriginal: "Open Original",
        delete: "Delete",
        preview: "Preview",
        filename: "Filename",
        type: "Type",
        tags: "Tags",
        size: "Size",
        actions: "Actions",
        dropToUpload: "Drop to Upload",
        types: {
          all: "All",
          image: "Image",
          video: "Video",
        },
      },
      users: {
        manageCommunity: "Manage Community",
        communitySubtitle:
          "Orchestrate the unique travelers and administrators across the Tripzy ecosystem.",
        totalUsersText: "Total of {count} active members",
        updateAuthority: "Update Authority",
        unban: "Unban User",
        ban: "Ban User",
        banned: "Banned",
        roles: {
          admin: "Administrator",
          editor: "Editor",
          author: "Author",
        },
        email: "Email Identity",
        role: "Access Level",
        user: "Traveler",
        control: "Control",
        fetchError: "Failed to fetch users.",
        updateSuccess: "User role updated!",
        updateError: "Failed to update user role!",
        banSuccess: "User has been banned.",
        unbanSuccess: "User has been unbanned.",
        statusError: "Failed to update user status.",
      },
      placeholder: {
        title: "Enter a captivating headline...",
        excerpt: "A short, catchy summary for travel lists...",
        metaKeywords: "adventure, city guide, hidden gem",
      },
      ai: {
        generating: "Generate with AI",
        generatingImage: "Gemini is envisioning your post...",
        imageUpgrade: "Image generation is currently being upgraded.",
        createSubtitle:
          "Create immersive travel stories powered by Gemini Intelligence.",
        improveProse: "Improve Prose",
        translateTurkish: "Translate to Turkish",
        generateOutline: "Post Structure",
        narrativeGuidelines: "AI Narrative Guidelines",
        dismissSuggestions: "Dismiss suggestions",
        generateFeaturedImage: "Generate Featured Image with AI",
        seoDiscovery: "SEO & Discovery Configuration",
        aiExcerptLabel: "AI Excerpt",
        aiKeywordsLabel: "AI Keywords",
      },
      maps: {
        title: "Interactive Maps",
        addMap: "Add New Map",
        editMap: "Edit Map",
        mapName: "Map Name",
        mapType: "Map Type",
        markers: "Markers Only",
        route: "Travel Route",
        polygon: "Area Highlight",
        centerLat: "Latitude",
        centerLng: "Longitude",
        zoom: "Zoom Level",
        saveMap: "Save Map Data",
        deleteMap: "Remove Map",
        clickToPlace: "Click map to place marker",
        loadError: "Failed to load maps",
        loading: "Loading Maps...",
        noMaps: "No maps added to this adventure yet.",
        namePlaceholder: "e.g., Hidden Cafes in Kadikoy",
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
      heroTitle1: "Maceranı ",
      heroTitle2: "Yaşa",
      heroSubtitle:
        "Dünya genelindeki seyahatlerimizden hikayeler, ipuçları ve rehberler keşfedin.",
      exploreStories: "Hikayeleri Keşfet",
      findDeals: "Tripzy'de Fırsat Bul",
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
      mediaSubtitle:
        "Görsel varlıklarınızı ve hikaye anlatımı kaynaklarınızı yönetin.",
      noMedia: "Medya bulunamadı. İlk dosyanızı yükleyerek başlayın.",
      uploadSuccess: "Medya başarıyla yüklendi!",
      uploadError: "Medya yüklemesi başarısız oldu.",
      loadError: "Medya yüklenemedi.",
      uploadFirst: "İlk varlığınızı yükleyerek başlayın",

      mediaLibrary: "Medya Kütüphanesi",
      unsplash: "Unsplash",
      library: "Kütüphane",
      searchMediaPlaceholder: "Dosyaları ara...",
      searchUnsplashPlaceholder: "Unsplash'te ara...",
      uploading: "Yükleniyor...",
      upload: "Yükle",
      import: "İçe Aktar",
      desertsFound: "Çöller bulundu...",
      exploreWorld: "Dünyayı Keşfet",
      searchArchivesEmpty:
        'Mevcut keşif arşivlerinizde "{query}" ile eşleşen dosya yok.',
      searchUnsplashEmpty:
        "Unsplash'ten yüksek kaliteli seyahat fotoğraflarını özgürce arayın.",
      accessingArchives: "Seyahat arşivlerine erişiliyor...",
      searchingWorld: "Küresel fotoğrafçılık aranıyor...",
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
      deleteSuccess: "Öğe başarıyla silindi.",
      saveSuccess: "Değişiklikler başarıyla kaydedildi.",
      saveDraft: "Taslağı Kaydet",
      viewLive: "Canlı Yazıyı Görüntüle", // New
      selectFeatured: "Öne Çıkan Medyayı Seç", // New
      altText: "Alternatif Metin", // New
      altPlaceholder: "Erişilebilirlik için medyayı tanımlayın", // New
      schedule: "Zamanla",
      submitReview: "İncelemeye Gönder",
      publishNow: "Şimdi Yayınla",
      aiExcerpt: "AI Özeti",
      aiKeywords: "AI Anahtar Kelimeler",
      aiNarrative: "AI Anlatım Rehberi",
      seoConfig: "SEO & Keşif Ayarları",
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
        backupExport: "Yedekleme ve Dışa Aktarma", // New
        exportPosts: "Yazıları Dışa Aktar (JSON)", // New
        exportComments: "Yorumları Dışa Aktar", // New
        exportSubscribers: "Aboneleri Dışa Aktar", // New
        exportMedia: "Medya Listesini Dışa Aktar", // New
      },
      profile: {
        title: "Yönetici Profili",
        subtitle: "Yönetici kimliğinizi ve kimlik bilgilerinizi yönetin.",
        fullName: "Ad Soyad",
        photoUrl: "Profil Fotoğrafı (URL)",
        saveProfile: "Profili Kaydet",
        saving: "Kaydediliyor...", // New
        currentLevel: "Mevcut Seviye", // New
        toNextLevel: "Sonraki Seviyeye", // New
        achievements: "Başarımlar", // New
      },
      dashboard: {
        welcomeBack: "Tekrar hoş geldiniz,",
        monitoringText:
          "Tripzy Lifestyle Adventures platform sağlığını ve içerik performansını izliyorsunuz.",
        systemOnline: "Sistem Çevrimiçi",
        errorTitle: "Panel Hatası",
        retry: "Tekrar Dene",
        commonIssues: "Yaygın sorunlar:",
        issueCredentials:
          ".env.local dosyasındaki Supabase kimlik bilgilerinizin doğru olduğunu kontrol edin",
        issueSchema:
          "Supabase veritabanınızda 'blog' şemasının mevcut olduğunu doğrulayın",
        issueMigration:
          "Geçiş (migration) komutlarını çalıştırdığınızdan emin olun",
        issueConsole:
          "Detaylı hata mesajları için tarayıcı konsolunu kontrol edin",
        activeStories: "Aktif Hikayeler",
        totalExplorers: "Toplam Gezgin",
        underReview: "İncelemede",
        editorialDrafts: "Editöryal Taslaklar",
        quickActions: "Hızlı İşlemler",
        newAdventure: "Yeni Macera",
        contentManager: "İçerik Yöneticisi",
        liveSite: "Canlı Site",
        importViralPost: "Viral Yazı İçe Aktar",
        autonomousTip: "Otonom İpucu",
        tipText:
          '"Gezginler Tokyo\'daki gizli yerel mücevherleri daha çok arıyor. Bir sonraki rehberinizde daha fazla bağımsız kafeyi öne çıkarmayı düşünün."',
        topPerforming: "En İyi Performans Gösteren Hikayeler",
        sortByViews: "Görüntülenmeye Göre Sırala",
        views: "Görüntülenme",
        importSuccess: "Viral yazı başarıyla içe aktarıldı!",
        performance: "Sinyal İstihbaratı",
      },
      placeholder: {
        title: "Etkileyici bir başlık girin...",
        excerpt: "Seyahat listeleri için kısa, akılda kalıcı bir özet...",
        metaKeywords: "macera, şehir rehberi, gizli mücevher",
      },
      ai: {
        generating: "Yapay Zeka ile Oluştur",
        generatingImage: "Gemini yazınızı hayal ediyor...",
        imageUpgrade: "Görüntü oluşturma şu anda güncelleniyor.",
        createSubtitle:
          "Gemini Zekası ile güçlendirilmiş sürükleyici seyahat hikayeleri oluşturun.",
        improveProse: "Metni İyileştir",
        translateTurkish: "Türkçe'ye Çevir",
        generateOutline: "Yazı Yapısı",
        narrativeGuidelines: "AI Anlatım Rehberi",
        dismissSuggestions: "Önerileri Kapat",
        generateFeaturedImage: "Yapay Zeka ile Öne Çıkan Görsel Oluştur",
        seoDiscovery: "SEO ve Keşif Yapılandırması",
        aiExcerptLabel: "AI Özet",
        aiKeywordsLabel: "AI Anahtar Kelimeler",
      },
      comments: {
        title: "Yorum Moderasyonu",
        subtitle:
          "Kullanıcılardan gelen bekleyen yorumları inceleyin ve onaylayın.",
        pending: "Bekleyen",
        approve: "Onayla",
        delete: "Sil",
        viewPost: "Yazıyı Görüntüle",
        empty: "Hepsi Tamam!",
        emptySubtitle: "İncelenecek bekleyen yorum yok.",
      },
      newsletter: "Bülten Aboneleri",
      newsletterSubtitle: "Sadık kitlenizi yönetin ve dışa aktarın.",
      manageUsers: "Kullanıcıları Yönet",
      user: "Kullanıcı",
      email: "E-posta",
      role: "Rol",
      media: {
        manageMedia: "Medya Kütüphanesi",
        mediaSubtitle:
          "Görsel hikayenizi resimler ve sinematik kliplerle düzenleyin.",
        newMedia: "Varlık Yükle",
        searchMedia: "Dosya adı veya etiketlere göre ara...",
        noMediaFound: "Arşivlerinizde medya bulunamadı.",
        dragDropText:
          "Dosyaları buraya sürükleyip bırakın veya kütüphanenizi oluşturmaya başlamak için yukarıdaki düğmeye tıklayın.",
        uploadFirst: "İlk varlığınızı yükleyin",
        importMedia: "Dış Köprü",
        importSubtitle: "Medya varlıklarını doğrudan dış kaynaklardan getirin.",
        pasteUrl:
          "Bir resmi veya videoyu Tripzy medya kütüphanenize dahil etmek için doğrudan URL'sini yapıştırın.",
        bridging: "Güvenle Köprü Kuruluyor...",
        importToLibrary: "Kütüphaneye Aktar",
        previewAppeared:
          "Başarılı bir köprüden sonra önizleme burada görünecektir.",
        uploadSuccess: "{count} dosya başarıyla yüklendi",
        uploadFailed: "Yükleme başarısız",
        urlCopied: "URL panoya kopyalandı",
        imagesAndVideos: "Resimler ve Videolar",
        uploading: "Yükleniyor",
        allTags: "Tüm Etiketler",
        copyUrl: "URL'yi Kopyala",
        openOriginal: "Orijinali Aç",
        delete: "Sil",
        preview: "Önizleme",
        filename: "Dosya Adı",
        type: "Tür",
        tags: "Etiketler",
        size: "Boyut",
        actions: "İşlemler",
        dropToUpload: "Yüklemek için Bırakın",
        types: {
          all: "Tümü",
          image: "Resim",
          video: "Video",
        },
      },
      users: {
        manageCommunity: "Topluluğu Yönet",
        communitySubtitle:
          "Tripzy ekosistemindeki gezginleri ve yöneticileri koordine edin.",
        totalUsersText: "Toplam {count} aktif üye",
        updateAuthority: "Yetkiyi Güncelle",
        unban: "Yasağı Kaldır",
        ban: "Kullanıcıyı Yasakla",
        banned: "Yasaklı",
        roles: {
          admin: "Yönetici",
          editor: "Editör",
          author: "Yazar",
        },
        email: "E-posta Kimliği",
        role: "Erişim Seviyesi",
        user: "Gezgin",
        control: "Kontrol",
        fetchError: "Kullanıcılar getirilemedi.",
        updateSuccess: "Kullanıcı rolü güncellendi!",
        updateError: "Kullanıcı rolü güncellenemedi!",
        banSuccess: "Kullanıcı yasaklandı.",
        unbanSuccess: "Kullanıcı yasağı kaldırıldı.",
        statusError: "Kullanıcı durumu güncellenemedi.",
      },
      maps: {
        title: "Etkileşimli Haritalar",
        addMap: "Yeni Harita Ekle",
        editMap: "Haritayı Düzenle",
        mapName: "Harita Adı",
        mapType: "Harita Türü",
        markers: "Sadece İşaretçiler",
        route: "Seyahat Rotası",
        polygon: "Alan Vurgulama",
        centerLat: "Enlem",
        centerLng: "Boylam",
        zoom: "Yakınlaştırma",
        saveMap: "Harita Verilerini Kaydet",
        deleteMap: "Haritayı Kaldır",
        clickToPlace: "İşaretçi yerleştirmek için haritaya tıklayın",
        loadError: "Haritalar yüklenemedi",
        loading: "Haritalar Yükleniyor...",
        noMaps: "Bu maceraya henüz harita eklenmedi.",
        namePlaceholder: "Örn: Kadıköy'deki Gizli Kafeler",
      },
    },
  },
};
