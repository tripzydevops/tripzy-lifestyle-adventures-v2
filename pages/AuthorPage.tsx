
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import PostCard from '../components/common/PostCard';
import Spinner from '../components/common/Spinner';
import { Post, User } from '../types';
import { postService } from '../services/postService';
import { userService } from '../services/userService';
import SEO from '../components/common/SEO';
import Pagination from '../components/common/Pagination';

const AuthorPage = () => {
  const { authorSlug } = useParams<{ authorSlug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [author, setAuthor] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthorAndPosts = async () => {
      if (!authorSlug) return;
      setLoading(true);
      try {
        const fetchedAuthor = await userService.getUserBySlug(authorSlug);
        if (fetchedAuthor) {
          setAuthor(fetchedAuthor);
          const { posts: fetchedPosts, totalPages: fetchedTotalPages } = await postService.getPostsByAuthorId(fetchedAuthor.id, currentPage);
          setPosts(fetchedPosts);
          setTotalPages(fetchedTotalPages);
        } else {
          setAuthor(null);
          setPosts([]);
          setTotalPages(0);
        }
      } catch (error) {
        console.error("Failed to fetch author data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorAndPosts();
  }, [authorSlug, currentPage]);

  const handlePageChange = (page: number) => {
    navigate(`${location.pathname}?page=${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center"><Spinner /></main>
        <Footer />
      </div>
    );
  }

  if (!author) {
    return (
      <div className="flex flex-col min-h-screen">
        <SEO title="Author Not Found" />
        <Header />
        <main className="flex-grow text-center py-20">
          <h1 className="text-4xl font-bold">Author not found</h1>
          <p className="text-gray-600 mt-4">Sorry, we couldn't find the author you were looking for.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SEO title={`Posts by ${author.name}`} description={`Browse all articles written by ${author.name}.`} />
      <Header />
      <main className="flex-grow">
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <img src={author.avatarUrl} alt={author.name} className="w-24 h-24 rounded-full mx-auto mb-4 shadow-lg border-4 border-white" />
              <h1 className="text-4xl font-bold font-serif text-neutral">Posts by {author.name}</h1>
            </div>

            {posts.length > 0 ? (
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
                <h3 className="text-2xl font-semibold">{author.name} hasn't published any posts yet.</h3>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AuthorPage;
