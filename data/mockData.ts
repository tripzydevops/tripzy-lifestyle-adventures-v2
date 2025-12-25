import { Post, User, SiteSettings, UserRole, PostStatus, Comment, MediaItem } from '../types';

export const mockUsers: User[] = [
  { id: '1', slug: 'admin-user', name: 'Admin User', email: 'admin@tripzy.com', role: UserRole.Administrator, avatarUrl: 'https://i.pravatar.cc/150?u=admin' },
  { id: '2', slug: 'editor-user', name: 'Editor User', email: 'editor@tripzy.com', role: UserRole.Editor, avatarUrl: 'https://i.pravatar.cc/150?u=editor' },
  { id: '3', slug: 'author-user', name: 'Author User', email: 'author@tripzy.com', role: UserRole.Author, avatarUrl: 'https://i.pravatar.cc/150?u=author' },
  { id: '4', slug: 'jane-doe', name: 'Jane Doe', email: 'jane.doe@tripzy.com', role: UserRole.Author, avatarUrl: 'https://i.pravatar.cc/150?u=jane' },
];

export const mockPosts: Post[] = [
  {
    id: '1',
    title: 'A Culinary Journey Through Italy',
    slug: 'a-culinary-journey-through-italy',
    content: '<p>Italy, a country synonymous with love, art, and of course, food. Join us as we explore the rich culinary traditions from the north to the south.</p><p>From creamy risottos in the north to sun-ripened tomatoes in the south, this is a food lover\'s dream! We will share recipes, restaurant recommendations, and stories from local chefs.</p>',
    excerpt: 'Discover the authentic flavors of Italy, from creamy risottos in the north to sun-ripened tomatoes in the south. A food lover\'s dream!',
    featuredMediaUrl: 'https://picsum.photos/seed/italy/1200/800',
    featuredMediaType: 'image',
    featuredMediaAlt: 'A beautiful plate of pasta with fresh tomatoes and basil.',
    category: 'Food & Travel',
    tags: ['Italy', 'Cuisine', 'Europe'],
    authorId: '3',
    status: PostStatus.Published,
    publishedAt: '2023-10-26T10:00:00Z',
    createdAt: '2023-10-20T10:00:00Z',
    updatedAt: '2023-10-26T10:00:00Z',
    views: 1258,
    metaTitle: 'A Culinary Journey Through Italy | Tripzy',
    metaDescription: 'Discover the authentic flavors of Italy on this culinary journey. From pasta to pizza, explore the best of Italian cuisine.',
  },
  {
    id: '2',
    title: 'The Hidden Gems of Kyoto',
    slug: 'the-hidden-gems-of-kyoto',
    content: `<p>Beyond the famous temples and shrines, Kyoto holds secrets waiting to be discovered. Let's wander off the beaten path to find serene bamboo forests, quaint tea houses, and artisan shops that have been around for centuries.</p><h2>A Gallery of Serenity</h2><p>Here are some snapshots from our journey through the quieter side of Kyoto.</p><div data-gallery="true"><img src="https://picsum.photos/seed/kyoto1/800/600" alt="A quiet temple garden with moss-covered stones."><img src="https://picsum.photos/seed/kyoto2/800/600" alt="Close-up of a traditional Japanese tea set."><img src="https://picsum.photos/seed/kyoto3/800/600" alt="A narrow alleyway in the Gion district at dusk."><img src="https://picsum.photos/seed/kyoto4/800/600" alt="Colorful autumn leaves framing a wooden bridge."><img src="https://picsum.photos/seed/kyoto5/800/600" alt="A geisha walking down a historic street."></div><p>Each corner of Kyoto tells a story, a testament to its rich history and enduring culture.</p>`,
    excerpt: 'Step away from the crowds and discover the serene temples, charming backstreets, and local artisans that make Kyoto truly magical.',
    featuredMediaUrl: 'https://picsum.photos/seed/kyoto/1200/800',
    featuredMediaType: 'image',
    featuredMediaAlt: 'A serene bamboo forest path in Kyoto, Japan.',
    category: 'Adventure',
    tags: ['Japan', 'Kyoto', 'Culture'],
    authorId: '4',
    status: PostStatus.Published,
    publishedAt: '2023-11-05T12:00:00Z',
    createdAt: '2023-11-01T12:00:00Z',
    updatedAt: '2023-11-05T12:00:00Z',
    views: 2345,
  },
  {
    id: '3',
    title: 'Backpacking Through South America: A Beginner\'s Guide',
    slug: 'backpacking-through-south-america-a-beginners-guide',
    content: '<p>Planning your first backpacking trip to South America? Here are some essential tips to get you started on an adventure of a lifetime.</p><h2>See the Andes in Motion</h2><p>Check out this stunning footage from our trek!</p><video controls="" style="width: 100%; aspect-ratio: 16 / 9; border-radius: 0.5rem;" src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"></video><p>The scale of the mountains is truly breathtaking. Every hiker should experience this at least once.</p>',
    excerpt: 'From planning your route to packing essentials, and staying safe, this guide covers everything you need to know for an unforgettable trip.',
    featuredMediaUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    featuredMediaType: 'video',
    featuredMediaAlt: 'A backpacker looking over the mountains in South America.',
    category: 'Guides',
    tags: ['South America', 'Backpacking', 'Tips'],
    authorId: '3',
    status: PostStatus.PendingReview,
    publishedAt: null,
    createdAt: '2023-11-10T15:00:00Z',
    updatedAt: '2023-11-10T15:00:00Z',
    views: 450,
  },
   {
    id: '4',
    title: 'Upcoming Post Idea',
    slug: 'upcoming-post-idea',
    content: '',
    excerpt: '',
    featuredMediaUrl: 'https://picsum.photos/seed/draft/1200/800',
    featuredMediaType: 'image',
    featuredMediaAlt: 'A placeholder image for a draft post.',
    category: 'Uncategorized',
    tags: [],
    authorId: '2',
    status: PostStatus.Draft,
    publishedAt: null,
    createdAt: '2023-11-12T11:00:00Z',
    updatedAt: '2023-11-12T11:00:00Z',
    views: 12,
  },
];

export const mockSiteSettings: SiteSettings = {
  siteName: "Tripzy Lifestyle Adventures",
  tagline: "Your ultimate guide to travel, adventure, and culture.",
  primaryColor: '#1e40af', // blue-800
  secondaryColor: '#3b82f6', // blue-500
  accentColor: '#f97316', // orange-500
  primaryFont: 'Playfair Display, serif',
  secondaryFont: 'Inter, sans-serif',
  seo: {
    ogTitle: "Tripzy Lifestyle Adventures",
    ogDescription: "Your ultimate guide to travel, adventure, and culture.",
    ogImage: "https://picsum.photos/seed/ogimage/1200/630",
  },
};

export const mockComments: Comment[] = [
    { id: 'c1', postId: '1', authorName: 'FoodieFan', content: 'This makes me want to book a flight to Italy right now! The pasta looks amazing.', createdAt: '2023-10-27T14:30:00Z' },
    { id: 'c2', postId: '1', authorName: 'TravelBug', content: 'Great article! Any recommendations for gluten-free options in Rome?', createdAt: '2023-10-28T09:00:00Z' },
    { id: 'c3', postId: '2', authorName: 'Wanderlust', content: 'Kyoto is one of my favorite places on earth. You captured its magic perfectly.', createdAt: '2023-11-06T18:20:00Z' },
];

export const mockMedia: MediaItem[] = [
    { id: 'm1', url: 'https://picsum.photos/seed/italy/1200/800', fileName: 'italy_pasta.jpg', uploadedAt: '2023-10-20T10:00:00Z', mediaType: 'image' },
    { id: 'm2', url: 'https://picsum.photos/seed/kyoto/1200/800', fileName: 'kyoto_bamboo.jpg', uploadedAt: '2023-11-01T12:00:00Z', mediaType: 'image' },
    { id: 'm3', url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', fileName: 'south_america_mountains.mp4', uploadedAt: '2023-11-10T15:00:00Z', mediaType: 'video' },
    { id: 'm4', url: 'https://picsum.photos/seed/hero/1600/900', fileName: 'hero_image.jpg', uploadedAt: '2023-10-15T08:00:00Z', mediaType: 'image' },
];