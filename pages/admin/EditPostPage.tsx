import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Post,
  PostStatus,
  MediaItem,
  GeneratedPost,
  SEOResult,
} from "../../types";
import { postService } from "../../services/postService";
import { aiContentService } from "../../services/aiContentService";
import { useAuth } from "../../hooks/useAuth";
import WYSIWYGEditor_V5 from "../../components/admin/WYSIWYGEditor";
import Spinner from "../../components/common/Spinner";
import { useToast } from "../../hooks/useToast";
import { useLanguage } from "../../localization/LanguageContext";
import PostEditorSidebar from "../../components/admin/PostEditorSidebar";
import MediaLibraryModal from "../../components/admin/MediaLibraryModal";
import AIGenerateModal from "../../components/admin/AIGenerateModal";
import AIQuickActions from "../../components/admin/AIQuickActions";
// Removed invalid import

import {
  Sparkles,
  Wand,
  Image as ImageIcon,
  Loader2,
  Search,
  Bot,
  X,
} from "lucide-react";

type EditorHandle = {
  insertHtml: (html: string) => void;
};

const EditPostPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user, isAuthor } = useAuth();
  const { addToast } = useToast();
  const { t } = useLanguage();

  const [post, setPost] = useState<Partial<Post>>({
    title: "",
    content: "<p>Start here...</p>",
    excerpt: "",
    category: "Uncategorized",
    tags: [],
    status: PostStatus.Draft,
    featuredMediaUrl: "",
    featuredMediaType: "image",
    featuredMediaAlt: "",
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    publishedAt: null,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [mediaModalPurpose, setMediaModalPurpose] = useState<
    "featured" | "insert"
  >("featured");

  const editorRef = useRef<EditorHandle>(null);
  const latestPost = useRef(post);
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    latestPost.current = post;
    isDirtyRef.current = isDirty;
  }, [post, isDirty]);

  const isNewPost = !postId;

  useEffect(() => {
    if (!isNewPost) {
      setLoading(true);
      postService
        .getPostById(postId)
        .then((fetchedPost) => {
          if (fetchedPost) {
            setPost(fetchedPost);
          } else {
            addToast(t("common.error"), "error");
            navigate("/admin/posts");
          }
        })
        .finally(() => setLoading(false));
    }
  }, [postId, isNewPost, navigate, addToast, t]);

  // Auto-save logic for Drafts
  useEffect(() => {
    if (isNewPost) return;

    const intervalId = setInterval(async () => {
      if (
        isDirtyRef.current &&
        latestPost.current.status === PostStatus.Draft
      ) {
        try {
          await postService.updatePost(postId!, latestPost.current);
          setIsDirty(false);
        } catch (e) {
          console.error("Auto-save failed:", e);
        }
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [isNewPost, postId]);

  const handlePostChange = useCallback((field: keyof Post, value: any) => {
    setPost((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  // Handler for when AI generates a complete blog post
  const handleAiPostGenerated = useCallback((generatedPost: GeneratedPost) => {
    setPost((prev) => ({
      ...prev,
      title: generatedPost.title,
      content: generatedPost.content,
      excerpt: generatedPost.excerpt,
      category: generatedPost.suggestedCategory || prev.category,
      tags: generatedPost.suggestedTags || prev.tags,
      metaTitle: generatedPost.metaTitle,
      metaDescription: generatedPost.metaDescription,
      metaKeywords: generatedPost.metaKeywords,
    }));
    setIsDirty(true);
    setIsAiModalOpen(false);
  }, []);

  const handleAiGenerateExcerpt = async () => {
    if (!post.content || post.content === "<p>Start here...</p>") {
      addToast(t("blog.leaveComment"), "info");
      return;
    }
    setIsAiGenerating(true);
    try {
      const excerpt = await aiContentService.generateExcerpt(post.content);
      handlePostChange("excerpt", excerpt);
      if (!post.metaDescription) {
        handlePostChange("metaDescription", excerpt);
      }
      addToast(t("common.success"), "success");
    } catch (e) {
      addToast(t("common.error"), "error");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiGenerateSEO = async () => {
    if (!post.title || !post.content) {
      addToast(t("blog.leaveComment"), "info");
      return;
    }
    setIsAiGenerating(true);
    try {
      const seoResult = await aiContentService.generateSEO(
        post.title,
        post.content
      );
      handlePostChange("metaTitle", seoResult.metaTitle);
      handlePostChange("metaDescription", seoResult.metaDescription);
      handlePostChange("metaKeywords", seoResult.metaKeywords);
      addToast(t("common.success"), "success");
    } catch (e) {
      addToast(t("common.error"), "error");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiGenerateImage = async () => {
    if (!post.title) {
      addToast(t("blog.leaveComment"), "info");
      return;
    }
    setIsAiGenerating(true);
    addToast("Gemini is envisioning your post...", "info");
    try {
      // Note: Gemini 2.0 Flash is text-only. This is a placeholder for future Image Gen integration
      // or using a search-based image fetcher.
      // For now, we return empty or use a placeholder service if available.
      handlePostChange("featuredMediaUrl", "");
      addToast("Image generation is currently being upgraded.", "info");
    } catch (e) {
      addToast(t("common.error"), "error");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiGenerateOutline = async () => {
    if (!post.title) {
      addToast(t("blog.leaveComment"), "info");
      return;
    }
    setIsAiGenerating(true);
    try {
      const outline = await aiContentService.generatePostOutline(post.title);
      setAiSuggestions(outline);
      addToast(t("common.success"), "success");
    } catch (e) {
      addToast(t("common.error"), "error");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiImprove = async () => {
    if (!post.content || post.content.length < 50) {
      addToast(t("blog.leaveComment"), "info");
      return;
    }
    setIsAiGenerating(true);
    try {
      const improved = await aiContentService.improveContent(
        post.content,
        "Enhance the prose quality, add sensory details, and make it more engaging while maintaining the same language."
      );
      handlePostChange("content", improved);
      addToast(t("common.success"), "success");
    } catch (e) {
      addToast(t("common.error"), "error");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiTranslateToTurkish = async () => {
    if (!post.content || post.content.length < 50) {
      addToast(t("blog.leaveComment"), "info");
      return;
    }
    setIsAiGenerating(true);
    try {
      const translated = await aiContentService.improveContent(
        post.content,
        "Translate everything into natural, professional, and evocative Turkish."
      );
      handlePostChange("content", translated);

      const translatedTitle = await aiContentService.improveContent(
        post.title || "",
        "Translate this post title into catchy, professional Turkish."
      );
      handlePostChange("title", translatedTitle);

      addToast(t("common.success"), "success");
    } catch (e) {
      addToast(t("common.error"), "error");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const openMediaModal = (purpose: "featured" | "insert") => {
    setMediaModalPurpose(purpose);
    setIsMediaModalOpen(true);
  };

  const handleSelectMedia = (mediaItem: MediaItem) => {
    if (mediaModalPurpose === "featured") {
      handlePostChange("featuredMediaUrl", mediaItem.url);
      handlePostChange("featuredMediaType", mediaItem.mediaType);
    } else {
      let htmlToInsert = "";
      if (mediaItem.mediaType === "video") {
        htmlToInsert = `<video controls style="width: 100%; aspect-ratio: 16/9; border-radius: 0.5rem;" src="${mediaItem.url}"></video><p><br></p>`;
      } else {
        htmlToInsert = `<img src="${mediaItem.url}" alt="${mediaItem.fileName}" style="width: 100%; height: auto; border-radius: 0.5rem;" /><p><br></p>`;
      }
      editorRef.current?.insertHtml(htmlToInsert);
    }
    setIsMediaModalOpen(false);
  };

  const handleMediaRemove = useCallback(() => {
    handlePostChange("featuredMediaUrl", "");
    handlePostChange("featuredMediaAlt", "");
  }, [handlePostChange]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent, newStatus?: PostStatus) => {
      e.preventDefault();
      if (!user || !post.title) {
        addToast(t("common.error"), "error");
        return;
      }
      setSaving(true);

      let finalStatus =
        newStatus ||
        (isAuthor ? PostStatus.PendingReview : PostStatus.Published);
      const postData = { ...post, authorId: user.id };

      if (finalStatus === PostStatus.Scheduled && !postData.publishedAt) {
        addToast(t("common.error"), "error");
        setSaving(false);
        return;
      }

      if (finalStatus !== PostStatus.Scheduled) {
        postData.publishedAt =
          finalStatus === PostStatus.Published
            ? new Date().toISOString()
            : null;
      }

      postData.status = finalStatus;

      try {
        if (isNewPost) {
          const savedPost = await postService.createPost(
            postData as Omit<
              Post,
              "id" | "slug" | "createdAt" | "updatedAt" | "views"
            >
          );
          addToast(t("admin.saveSuccess"), "success");
          navigate(`/admin/posts/edit/${savedPost.id}`, { replace: true });
        } else {
          const savedPost = await postService.updatePost(postId!, postData);
          addToast(t("admin.saveSuccess"), "success");
          setPost(savedPost);
          setIsDirty(false);
        }
      } catch (error) {
        addToast(t("common.error"), "error");
      } finally {
        setSaving(false);
      }
    },
    [user, post, isAuthor, isNewPost, addToast, navigate, postId, t]
  );

  if (loading)
    return (
      <div className="py-20 flex justify-center">
        <Spinner />
      </div>
    );

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleSelectMedia}
      />

      <AIGenerateModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onGenerated={handleAiPostGenerated}
      />

      <form onSubmit={(e) => handleSubmit(e)}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2">
              {isNewPost ? t("admin.newPost") : t("admin.editPost")}
            </h1>
            <p className="text-gray-400 text-sm">
              Create immersive travel stories powered by Gemini Intelligence.
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {/* AI Generate Button - Only show for new posts or empty content */}
            {(isNewPost ||
              !post.content ||
              post.content === "<p>Start here...</p>") && (
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-purple-500 to-gold text-white rounded-xl font-bold hover:shadow-xl hover:shadow-purple-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Bot size={18} />
                Generate with AI
              </button>
            )}
            <button
              type="button"
              onClick={(e) => handleSubmit(e, PostStatus.Draft)}
              disabled={saving}
              className="flex-1 md:flex-none px-6 py-3 bg-navy-800 text-white rounded-xl font-bold border border-white/5 hover:bg-navy-700 transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : null}
              Save Draft
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 md:flex-none px-6 py-3 bg-gold text-navy-950 rounded-xl font-bold hover:shadow-xl hover:shadow-gold/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : null}
              {post.status === PostStatus.Scheduled
                ? "Schedule"
                : isAuthor
                ? "Submit For Review"
                : "Publish Now"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Title Section */}
            <div className="bg-navy-900/50 backdrop-blur-xl p-6 rounded-3xl border border-white/5">
              <label
                htmlFor="title"
                className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1"
              >
                {t("admin.form.postTitle")}
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={post.title}
                  onChange={(e) => handlePostChange("title", e.target.value)}
                  className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-6 py-4 text-2xl font-bold text-white focus:outline-none focus:border-gold/50 transition-all placeholder:text-navy-700"
                  required
                  placeholder="Enter a captivating headline..."
                />
                <button
                  type="button"
                  title="Generate Featured Image with AI"
                  disabled={isAiGenerating}
                  onClick={handleAiGenerateImage}
                  className="p-4 bg-navy-800 border border-white/5 text-purple-400 rounded-2xl hover:border-purple-400/50 hover:bg-purple-400/10 transition-all shrink-0 group"
                >
                  {isAiGenerating ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <ImageIcon
                      size={24}
                      className="group-hover:scale-110 transition-transform"
                    />
                  )}
                </button>
              </div>
            </div>
            {/* AI Assistant Toolbar */}
            {aiSuggestions && (
              <div className="bg-navy-800/80 backdrop-blur-md p-6 rounded-2xl border border-gold/20 mb-6 font-serif relative shadow-lg">
                <button
                  onClick={() => setAiSuggestions(null)}
                  className="absolute top-4 right-4 text-gold/50 hover:text-gold transition-colors"
                  title="Dismiss suggestions"
                >
                  <X size={20} />
                </button>
                <h2 className="flex items-center gap-2 text-gold m-0 text-lg font-bold mb-4">
                  <Sparkles size={20} /> AI Narrative Guidelines
                </h2>
                <div className="text-gray-200 leading-relaxed whitespace-pre-line text-sm border-l-2 border-gold/30 pl-4">
                  {aiSuggestions}
                </div>
              </div>
            )}
            <AIQuickActions
              onImprove={handleAiImprove}
              onTranslate={handleAiTranslateToTurkish}
              onOutline={handleAiGenerateOutline}
              isGenerating={isAiGenerating}
            />
            <div className="bg-navy-900/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl min-h-[500px]">
              <WYSIWYGEditor_V5
                ref={editorRef}
                value={post.content || ""}
                onChange={(content) => handlePostChange("content", content)}
                onMediaButtonClick={() => openMediaModal("insert")}
              />
            </div>
            {/* SEO & metadata */}
            <div className="bg-navy-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                    <Search size={20} className="text-gold" />
                    {t("admin.form.metaInformation")}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">
                    SEO & Discovery Configuration
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAiGenerateExcerpt}
                    disabled={isAiGenerating}
                    className="flex items-center gap-1.5 text-[10px] font-bold bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full border border-blue-500/20 hover:bg-blue-500/20 transition-all uppercase tracking-widest"
                  >
                    <Sparkles size={12} /> AI Excerpt
                  </button>
                  <button
                    type="button"
                    onClick={handleAiGenerateSEO}
                    disabled={isAiGenerating}
                    className="flex items-center gap-1.5 text-[10px] font-bold bg-purple-500/10 text-purple-400 px-4 py-2 rounded-full border border-purple-500/20 hover:bg-purple-500/20 transition-all uppercase tracking-widest"
                  >
                    <Wand size={12} /> AI Keywords
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label
                    htmlFor="excerpt"
                    className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1"
                  >
                    {t("admin.form.postExcerpt")}
                  </label>
                  <textarea
                    id="excerpt"
                    value={post.excerpt}
                    onChange={(e) =>
                      handlePostChange("excerpt", e.target.value)
                    }
                    rows={3}
                    className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-5 py-4 text-gray-300 focus:outline-none focus:border-gold/30 transition-all"
                    placeholder="A short, catchy summary for travel lists..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label
                      htmlFor="metaTitle"
                      className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1"
                    >
                      {t("admin.form.metaTitle")}
                    </label>
                    <input
                      type="text"
                      id="metaTitle"
                      value={post.metaTitle || ""}
                      onChange={(e) =>
                        handlePostChange("metaTitle", e.target.value)
                      }
                      className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-5 py-3 text-gray-300 focus:outline-none focus:border-gold/30"
                      placeholder={post.title}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="metaKeywords"
                      className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1"
                    >
                      {t("admin.form.metaKeywords")}
                    </label>
                    <input
                      type="text"
                      id="metaKeywords"
                      value={post.metaKeywords || ""}
                      onChange={(e) =>
                        handlePostChange("metaKeywords", e.target.value)
                      }
                      className="w-full bg-navy-800/30 border border-white/5 rounded-2xl px-5 py-3 text-gray-300 focus:outline-none focus:border-gold/30"
                      placeholder="adventure, city guide, hidden gem"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <PostEditorSidebar
            post={post}
            onPostChange={handlePostChange}
            onMediaRemove={handleMediaRemove}
            onSetFeaturedMedia={() => openMediaModal("featured")}
            isNewPost={isNewPost}
            isAuthor={!!isAuthor}
          />
        </div>
      </form>
    </div>
  );
};

export default EditPostPage;
