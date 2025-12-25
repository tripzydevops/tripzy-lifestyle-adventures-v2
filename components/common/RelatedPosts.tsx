// components/common/RelatedPosts.tsx
import React, { useState, useEffect } from 'react';
import { Post } from '../../types';
import { postService } from '../../services/postService';
import PostCard from './PostCard';
import Spinner from './Spinner';

interface RelatedPostsProps {
  currentPostId: string;
  category: string;
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ currentPostId, category }) => {
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      setLoading(true);
      try {
        const posts = await postService.getRelatedPosts(currentPostId, category);
        setRelatedPosts(posts);
      } catch (error) {
        console.error("Failed to fetch related posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRelated();
  }, [currentPostId, category]);

  if (loading) {
    return <Spinner />;
  }
  
  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-neutral mb-12">You Might Also Like</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {relatedPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedPosts;
