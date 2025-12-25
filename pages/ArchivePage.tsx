
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import PostCard from '../components/common/PostCard';
import Spinner from '../components/common/Spinner';
import { Post } from '../types';
import { postService } from '../services/postService';
import SEO from '../components/common/SEO';
import Pagination from '../components/common/Pagination';

interface ArchivePageProps {
  type: 'category' | 'tag';
}

const ArchivePage: React.FC<ArchivePageProps> = ({ type }) => {
  const { categoryName, tagName } = useParams<{ categoryName?: string, tagName?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const name = type === 'category' ? categoryName : tagName;
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!name) return;
      setLoading(true);
      let response: { posts: Post[], totalPages: number } = { posts: [], totalPages: 0 };
      if (type === 'category') {
        response = await postService.getPostsByCategory(name, currentPage);
      } else {
        response = await postService.getPostsByTag(name, currentPage);
      }
      setPosts(response.posts);
      setTotalPages(response.totalPages);
      setLoading(false);
    };
    
    fetchPosts();
  }, [name, type, currentPage]);

  const handlePageChange = (page: number) => {
    navigate(`${location.pathname}?page=${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageTitle = `${type === 'category' ? 'Category' : 'Tag'}: ${name}`;

  return (
    <div className="flex flex-col min-h-screen">
      <SEO title={pageTitle} />
      <Header />
      <main className="flex-grow">
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl font-bold text-center text-neutral mb-12 capitalize">{pageTitle}</h1>
            
            {loading ? (
              <Spinner />
            ) : posts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
                 <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
                <div className="text-center text-gray-500 py-16">
                    <h3 className="text-2xl font-semibold">No posts found.</h3>
                    <p>There are no published posts for this {type} yet.</p>
                </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ArchivePage;
