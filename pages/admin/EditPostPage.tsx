
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Post, PostStatus, MediaItem } from '../../types';
import { postService } from '../../services/postService';
import { aiService } from '../../services/aiService';
import { useAuth } from '../../hooks/useAuth';
import WYSIWYGEditor from '../../components/admin/WYSIWYGEditor';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../hooks/useToast';
import PostEditorSidebar from '../../components/admin/PostEditorSidebar';
import MediaLibraryModal from '../../components/admin/MediaLibraryModal';
import { Sparkles, Wand2, Image as ImageIcon, ClipboardList, LoaderCircle, CheckCircle2 } from 'lucide-react';

type EditorHandle = {
  insertHtml: (html: string) => void;
};

const EditPostPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user, isAuthor } = useAuth();
  const { addToast } = useToast();
  
  const [post, setPost] = useState<Partial<Post>>({
    title: '',
    content: '<p>Start here...</p>',
    excerpt: '',
    category: 'Uncategorized',
    tags: [],
    status: PostStatus.Draft,
    featuredMediaUrl: '',
    featuredMediaType: 'image',
    featuredMediaAlt: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    publishedAt: null,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalPurpose, setMediaModalPurpose] = useState<'featured' | 'insert'>('featured');

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
      postService.getPostById(postId)
        .then(fetchedPost => {
          if (fetchedPost) {
            setPost(fetchedPost);
          } else {
            addToast('Post not found', 'error');
            navigate('/admin/posts');
          }
        })
        .finally(() => setLoading(false));
    }
  }, [postId, isNewPost, navigate, addToast]);

  // Auto-save logic for Drafts
  useEffect(() => {
    if (isNewPost) return;

    const intervalId = setInterval(async () => {
      if (isDirtyRef.current && latestPost.current.status === PostStatus.Draft) {
        try {
          await postService.updatePost(postId!, latestPost.current);
          setIsDirty(false);
          console.debug("Draft auto-saved.");
        } catch (e) {
          console.error("Auto-save failed:", e);
        }
      }
    }, 60000); // Auto-save every minute

    return () => clearInterval(intervalId);
  }, [isNewPost, postId]);

  const handlePostChange = useCallback((field: keyof Post, value: any) => {
    setPost(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const handleAiGenerateExcerpt = async () => {
    if (!post.content || post.content === '<p>Start here...</p>') {
      addToast('Please write some content first!', 'info');
      return;
    }
    setIsAiGenerating(true);
    try {
      const excerpt = await aiService.generateExcerpt(post.content);
      handlePostChange('excerpt', excerpt);
      handlePostChange('metaDescription', excerpt);
      addToast('AI generated an excerpt based on your content.', 'success');
    } catch (e) {
      addToast('AI generation failed.', 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiGenerateSEO = async () => {
    if (!post.title) {
      addToast('Please enter a title first!', 'info');
      return;
    }
    setIsAiGenerating(true);
    try {
      const keywords = await aiService.generateSEOKeywords(post.title, post.content || "");
      handlePostChange('metaKeywords', keywords);
      addToast('AI generated SEO keywords.', 'success');
    } catch (e) {
      addToast('AI SEO generation failed.', 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiGenerateImage = async () => {
    if (!post.title) {
      addToast('Please enter a title for image context!', 'info');
      return;
    }
    setIsAiGenerating(true);
    addToast('Gemini is envisioning your post...', 'info');
    try {
      const imageUrl = await aiService.generateFeaturedImage(post.title);
      handlePostChange('featuredMediaUrl', imageUrl);
      handlePostChange('featuredMediaType', 'image');
      addToast('AI generated a custom featured image!', 'success');
    } catch (e) {
      addToast('AI image generation failed.', 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiGenerateOutline = async () => {
    if (!post.title) {
      addToast('Enter a title to generate an outline.', 'info');
      return;
    }
    setIsAiGenerating(true);
    addToast('Brainstorming your story...', 'info');
    try {
      const outline = await aiService.generatePostOutline(post.title);
      const htmlOutline = `<div class="ai-outline bg-blue-50/50 p-6 rounded-lg border-2 border-dashed border-blue-200 my-4 font-serif">
        <h2 class="flex items-center gap-2 text-primary m-0"><Sparkles size={20} /> AI Generated Suggestions</h2>
        <div class="mt-4 text-gray-700">${outline.replace(/\n/g, '<br>')}</div>
      </div><p><br></p>`;
      editorRef.current?.insertHtml(htmlOutline);
      addToast('Structure and tips added to editor!', 'success');
    } catch (e) {
      addToast('Failed to generate outline.', 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiProofread = async () => {
    if (!post.content || post.content.length < 50) {
      addToast('Add more content before proofreading.', 'info');
      return;
    }
    setIsAiGenerating(true);
    addToast('Improving your narrative...', 'info');
    try {
      const improved = await aiService.proofreadContent(post.content);
      handlePostChange('content', improved);
      addToast('Content polished by Gemini!', 'success');
    } catch (e) {
      addToast('Proofreading failed.', 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };
  
  const openMediaModal = (purpose: 'featured' | 'insert') => {
    setMediaModalPurpose(purpose);
    setIsMediaModalOpen(true);
  };

  const handleSelectMedia = (mediaItem: MediaItem) => {
    if (mediaModalPurpose === 'featured') {
      handlePostChange('featuredMediaUrl', mediaItem.url);
      handlePostChange('featuredMediaType', mediaItem.mediaType);
    } else {
      let htmlToInsert = '';
      if (mediaItem.mediaType === 'video') {
        htmlToInsert = `<video controls style="width: 100%; aspect-ratio: 16/9; border-radius: 0.5rem;" src="${mediaItem.url}"></video><p><br></p>`;
      } else {
        htmlToInsert = `<img src="${mediaItem.url}" alt="${mediaItem.fileName}" style="width: 100%; height: auto; border-radius: 0.5rem;" /><p><br></p>`;
      }
      editorRef.current?.insertHtml(htmlToInsert);
    }
    setIsMediaModalOpen(false);
  };

  const handleMediaRemove = useCallback(() => {
    handlePostChange('featuredMediaUrl', '');
    handlePostChange('featuredMediaAlt', '');
  }, [handlePostChange]);

  const handleSubmit = useCallback(async (e: React.FormEvent, newStatus?: PostStatus) => {
    e.preventDefault();
    if (!user || !post.title) {
        addToast('Post title is required.', 'error');
        return;
    }
    setSaving(true);
    
    let finalStatus = newStatus || (isAuthor ? PostStatus.PendingReview : PostStatus.Published);
    const postData = { ...post, authorId: user.id };

    if (finalStatus === PostStatus.Scheduled && !postData.publishedAt) {
      addToast('Please select a publication date for scheduled posts.', 'error');
      setSaving(false);
      return;
    }
    
    if (finalStatus !== PostStatus.Scheduled) {
        postData.publishedAt = finalStatus === PostStatus.Published ? new Date().toISOString() : null;
    }

    postData.status = finalStatus;

    try {
        if(isNewPost) {
            const savedPost = await postService.createPost(postData as Omit<Post, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'views'>);
            addToast('Post created successfully!', 'success');
            navigate(`/admin/posts/edit/${savedPost.id}`, { replace: true });
        } else {
            const savedPost = await postService.updatePost(postId!, postData);
            addToast('Post updated successfully!', 'success');
            setPost(savedPost);
            setIsDirty(false);
        }
    } catch(error) {
        addToast('An error occurred while saving.', 'error');
    } finally {
        setSaving(false);
    }
  }, [user, post, isAuthor, isNewPost, addToast, navigate, postId]);

  if (loading) return <Spinner />;

  return (
    <>
    <MediaLibraryModal isOpen={isMediaModalOpen} onClose={() => setIsMediaModalOpen(false)} onSelect={handleSelectMedia} />
    <form onSubmit={(e) => handleSubmit(e)}>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">{isNewPost ? 'Create New Post' : 'Edit Post'}</h1>
            <div className="flex gap-2">
                 <button type="button" onClick={(e) => handleSubmit(e, PostStatus.Draft)} disabled={saving} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition disabled:bg-gray-300 flex items-center gap-2">
                    {saving ? <LoaderCircle size={16} className="animate-spin" /> : null}
                    Save Draft
                </button>
                <button type="submit" disabled={saving} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-800 transition disabled:bg-gray-300 flex items-center gap-2">
                    {saving ? <LoaderCircle size={16} className="animate-spin" /> : null}
                    {post.status === PostStatus.Scheduled ? 'Schedule' : (isAuthor ? 'Submit for Review' : 'Publish')}
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-primary">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1 uppercase tracking-wider">Title</label>
                    <div className="flex gap-2">
                      <input type="text" name="title" id="title" value={post.title} onChange={(e) => handlePostChange('title', e.target.value)} className="w-full border-gray-300 rounded-md text-xl font-bold focus:ring-primary focus:border-primary" required placeholder="Your Post Title" />
                      <button 
                        type="button" 
                        title="AI Envision Image"
                        disabled={isAiGenerating}
                        onClick={handleAiGenerateImage}
                        className="p-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition shrink-0"
                      >
                        {isAiGenerating ? <LoaderCircle size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                      </button>
                    </div>
                </div>
                
                {/* AI Assistant Toolbar */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-1 rounded-lg shadow-lg">
                  <div className="bg-white rounded-md p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <Sparkles size={20} className="text-yellow-500" />
                      <span>Gemini Intelligence Assistant</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       <button 
                        type="button" 
                        onClick={handleAiGenerateOutline}
                        disabled={isAiGenerating}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-100 transition border border-indigo-100"
                      >
                        <ClipboardList size={14} /> Structure Post
                      </button>
                      <button 
                        type="button" 
                        onClick={handleAiProofread}
                        disabled={isAiGenerating}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-green-50 text-green-700 px-4 py-2 rounded-md hover:bg-green-100 transition border border-green-100"
                      >
                        <CheckCircle2 size={14} /> Proofread & Polish
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md">
                    <WYSIWYGEditor 
                      ref={editorRef}
                      value={post.content || ''} 
                      onChange={(content) => handlePostChange('content', content)}
                      onMediaButtonClick={() => openMediaModal('insert')}
                    />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900 font-serif">SEO & Metadata</h3>
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={handleAiGenerateExcerpt}
                          disabled={isAiGenerating}
                          className="flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition disabled:opacity-50"
                        >
                          <Sparkles size={14} /> AI Excerpt
                        </button>
                        <button 
                          type="button" 
                          onClick={handleAiGenerateSEO}
                          disabled={isAiGenerating}
                          className="flex items-center gap-1 text-xs font-semibold bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-100 transition disabled:opacity-50"
                        >
                          <Wand2 size={14} /> AI Keywords
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">Search Snippet (Excerpt)</label>
                            <textarea id="excerpt" value={post.excerpt} onChange={(e) => handlePostChange('excerpt', e.target.value)} rows={2} className="w-full border-gray-300 rounded-md focus:ring-primary focus:border-primary" placeholder="A short summary for lists and search results." />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                                <input type="text" id="metaTitle" value={post.metaTitle || ''} onChange={(e) => handlePostChange('metaTitle', e.target.value)} className="w-full border-gray-300 rounded-md" placeholder={post.title} />
                            </div>
                            <div>
                                <label htmlFor="metaKeywords" className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                                <input type="text" id="metaKeywords" value={post.metaKeywords || ''} onChange={(e) => handlePostChange('metaKeywords', e.target.value)} className="w-full border-gray-300 rounded-md" placeholder="travel, guide, adventure" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <PostEditorSidebar 
                post={post}
                onPostChange={handlePostChange}
                onMediaRemove={handleMediaRemove}
                onSetFeaturedMedia={() => openMediaModal('featured')}
                isNewPost={isNewPost}
                isAuthor={!!isAuthor}
            />
        </div>
    </form>
    </>
  );
};

export default EditPostPage;
