
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manual .env parser
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2 && !line.startsWith('#')) {
                const key = parts[0].trim();
                const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
                process.env[key] = val;
            }
        });
    }
}
loadEnv();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log("Fetching Post: Bodrum Yaz Günlüğü...");

    const { data: posts, error } = await supabase
        .schema('blog')
        .from('posts')
        .select('*')
        .ilike('title', "%Bodrum%");

    if (error || !posts || posts.length === 0) {
        console.error("❌ Post not found!", error);
        return;
    }

    const post = posts[0];
    console.log(`✅ Found Post: ${post.title}`);
    console.log(`🖼️ Featured Image: ${post.featured_image}`);

    // Check Content for Pollinations
    const content = post.content || "";
    const pollinationMatches = content.match(/pollinations\.ai/g);
    console.log(`🔍 Pollinations Matches in Content: ${pollinationMatches ? pollinationMatches.length : 0}`);

    if (content.includes("pollinations.ai")) {
        console.log("⚠️ WARNING: Found Pollinations URLs! Sample:");
        const match = content.match(/https:\/\/image\.pollinations\.ai[^\s"')]+/);
        if (match) console.log(match[0]);
    } else {
        console.log("✅ No Pollinations URLs found in content.");
    }
}

main();
