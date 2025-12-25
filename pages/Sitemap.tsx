import React, { useState, useEffect } from 'react';
import { postService } from '../services/postService';
import { Post } from '../types';
import Spinner from '../components/common/Spinner';

const Sitemap = () => {
    const [sitemapXml, setSitemapXml] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const generateSitemap = async () => {
            try {
                // FIX: Destructure the `posts` array from the response and fetch all published posts for the sitemap, not just the first page.
                const { posts } = await postService.getPublishedPosts(1, 10000);
                const baseUrl = window.location.origin;

                const staticPages = [
                    { url: `${baseUrl}/`, priority: '1.00' },
                    { url: `${baseUrl}/about`, priority: '0.80' },
                    { url: `${baseUrl}/contact`, priority: '0.80' },
                ];
                
                const postUrls = posts.map(post => `
    <url>
        <loc>${baseUrl}/post/${post.slug}</loc>
        <lastmod>${new Date(post.updatedAt).toISOString().split('T')[0]}</lastmod>
        <priority>0.90</priority>
    </url>`).join('');

                const staticUrls = staticPages.map(page => `
    <url>
        <loc>${page.url}</loc>
        <priority>${page.priority}</priority>
    </url>`).join('');

                const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${staticUrls}
    ${postUrls}
</urlset>`;

                setSitemapXml(xml.trim());
            } catch (error) {
                console.error("Failed to generate sitemap:", error);
                setSitemapXml('<!-- Error generating sitemap -->');
            } finally {
                setLoading(false);
            }
        };

        generateSitemap();
    }, []);

    if (loading) {
        return <Spinner />;
    }

    // In a real-world SSR/SSG setup, this would be served as an actual XML file.
    // Here, we display it as plain text content for demonstration within a client-side app.
    return (
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace', padding: '1rem' }}>
            {sitemapXml}
        </pre>
    );
};

export default Sitemap;