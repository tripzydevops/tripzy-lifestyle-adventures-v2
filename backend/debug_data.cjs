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

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Fetching Map Data for 'İstanbul''da Bir Gün'...");

    // 1. Get Post
    const { data: posts, error: postError } = await supabase
        .schema('blog') // Ensure schema is correct? postService uses 'blog' schema.
        .from('posts')
        .select('id, title')
        .eq('title', "İstanbul'da Bir Gün");

    if (postError || !posts || posts.length === 0) {
        console.error("❌ Post not found!", postError);
        return;
    }

    const post = posts[0];
    console.log(`✅ Found Post ID: ${post.id}`);

    // 2. Get Map
    const { data: maps, error: mapError } = await supabase
        .schema('public') // Maps are usually in 'public' or 'blog'? generate_content uses 'public' implicitly or specified?
        // generate_content code: supabase.table("maps")... usually defaults to public.
        .from('maps')
        .select('*')
        .eq('post_id', post.id);

    if (mapError || !maps || maps.length === 0) {
        console.error("❌ Map not found!", mapError);
        return;
    }

    const mapData = maps[0];
    console.log(`✅ Found Map ID: ${mapData.id}`);
    console.log(`📍 Center: ${mapData.center_lat}, ${mapData.center_lng}`);

    if (mapData.data) {
        console.log(`🔢 Total Points: ${mapData.data.length}`);
        mapData.data.forEach(p => {
            console.log(`   - ${p.title} (${p.category})`);
        });
    } else {
        console.log("⚠️ mapData.data is NULL or undefined");
    }
}

main();
