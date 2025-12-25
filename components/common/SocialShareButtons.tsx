import React from 'react';
import { Post } from '../../types';
import { useToast } from '../../hooks/useToast';
import { Facebook, Twitter, Link as LinkIcon } from 'lucide-react';

// Custom Pinterest Icon as SVG component since it's not in lucide-react
const PinterestIcon = (props: React.ComponentProps<'svg'> & { size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={props.size || 24}
        height={props.size || 24}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0"
        {...props}
    >
        <path d="M12.017 1.983c-5.917 0-9.843 3.772-9.843 8.337 0 2.833 1.583 5.433 4.1 6.65.442.217.533.017.55-.425.017-.4.183-1.617.267-2.017.1-.492.65-.2.95.142.441.508.7 1.583.7 2.308 0 2.917-2.033 5.05-5.049 5.05-3.667 0-6.25-2.683-6.25-6.142 0-2.35 1.483-4.35 3.6-4.35 1.583 0 2.45 1.15 2.45 2.5 0 .958-.617 2.375-.95 3.725-.283 1.142.567 2.083 1.7 2.083 2.017 0 3.333-2.5 3.333-5.225 0-2.225-1.55-3.858-4.233-3.858-2.95 0-4.883 2.158-4.883 4.85 0 .841.333 1.75.767 2.258.1.116.083.2.05.325-.017.116-.2.833-.233.95-.05.217-.183.267-.4.15-1.45-.75-2.35-2.7-2.35-4.442 0-3.35 2.85-6.25 6.783-6.25 3.533 0 6.267 2.45 6.267 5.758 0 3.542-2.183 6.317-5.25 6.317-1.017 0-1.967-.525-2.292-1.125l-.75-2.85c-.317-1.225-.133-2.5.583-3.25 1.3-1.383.95-3.333-1.1-3.333-1.067 0-1.85.8-1.85 1.767 0 .416.116.9.283 1.316.017.033.017.067.017.1l-1.467 6.133c-.567 2.358.5 4.5 2.733 4.5 1.05 0 1.95-.417 2.617-1.017.267-.233.517-.55.7-1.017.6-1.417.85-3.033.85-4.425 0-1.233-.233-2.358-.683-3.35-1.533-3.35-3.133-2.95-3.133.5z"/>
    </svg>
);

interface SocialShareButtonsProps {
  post: Post;
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ post }) => {
  const { addToast } = useToast();
  const postUrl = window.location.href;
  const encodedUrl = encodeURIComponent(postUrl);
  const encodedTitle = encodeURIComponent(post.title);
  const encodedMediaUrl = encodeURIComponent(post.featuredMediaUrl);
  const isVideo = post.featuredMediaType === 'video';

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedMediaUrl}&description=${encodedTitle}`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(postUrl).then(() => {
      addToast('Link copied to clipboard!', 'success');
    }, (err) => {
      addToast('Failed to copy link.', 'error');
      console.error('Could not copy text: ', err);
    });
  };

  const socialButtons = [
    { name: 'Facebook', url: shareLinks.facebook, icon: Facebook, color: 'hover:bg-[#1877F2]' },
    { name: 'Twitter', url: shareLinks.twitter, icon: Twitter, color: 'hover:bg-[#1DA1F2]' },
    { name: 'Pinterest', url: shareLinks.pinterest, icon: PinterestIcon, color: 'hover:bg-[#E60023]', hideOnVideo: true },
  ];

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-center text-gray-800 mb-4">Share this post</h3>
      <div className="flex items-center justify-center gap-4">
        {socialButtons.map((social) => {
          if (social.hideOnVideo && isVideo) {
            return null;
          }
          return (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share on ${social.name}`}
              className={`w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full transition-colors duration-300 ${social.color} hover:text-white`}
            >
              <social.icon size={24} />
            </a>
          );
        })}
         <button
            onClick={copyToClipboard}
            aria-label="Copy post link"
            type="button"
            className="w-12 h-12 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full transition-colors duration-300 hover:bg-gray-700 hover:text-white"
        >
            <LinkIcon size={24} />
        </button>
      </div>
    </div>
  );
};

export default SocialShareButtons;