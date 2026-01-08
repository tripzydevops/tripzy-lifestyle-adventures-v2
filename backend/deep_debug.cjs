
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manual .env parser
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env');
    console.log(`📂 Loading .env from: ${envPath}`);
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2 && !line.startsWith('#')) {
                const key = parts[0].trim();
                const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '').replace(/\r/g, '');
                process.env[key] = val;
            }
        });
    }
}
loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Env Vars (URL or KEY)");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("🔍 Deep Debug for 'İstanbul''da Bir Gün'...");

    // 1. Get Post
    const { data: posts, error } = await supabase
        .schema('blog')
        .from('posts')
        .select('id, title, content, updated_at')
        .eq('title', "İstanbul'da Bir Gün");

    if (!posts || posts.length === 0) {
        console.error("❌ Post not found!", error);
        return;
    }

    const post = posts[0];
    console.log(`✅ Post Found: ${post.id}`);

    // 2. Check Duplicate Maps
    const { data: maps, error: mapError } = await supabase
        .schema('public')
        .from('maps')
        .select('id, data, created_at')
        .eq('post_id', post.id)
        .order('created_at', { ascending: false });

    if (maps) {
        console.log(`🗺️  Found ${maps.length} Map Entries!`);
        maps.forEach((m, idx) => {
            const points = m.data ? m.data.length : 0;
            console.log(`   [Map ${idx}] ID: ${m.id} | Points: ${points} | Created: ${m.created_at}`);
        });
    }
}

main();
