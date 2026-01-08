
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manual Env Parsing
const envPath = path.resolve(__dirname, '../.env');
let envConfig = {};
try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envConfig[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    });
} catch (e) {
    console.error("Could not read .env file");
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || envConfig.VITE_SUPABASE_URL;
// Try Service Key first, then Anon Key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectPost(slug) {
    console.log(`--- Inspecting Post: ${slug} ---`);
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error("Error fetching post:", error);
        return;
    }

    if (!data) {
        console.log("Post not found");
        return;
    }

    console.log(`Title: ${data.title}`);
    console.log(`Featured Image: ${data.featured_media_url}`);

    if (data.map_data) {
        console.log("Map Data:", JSON.stringify(data.map_data, null, 2));
    } else {
        console.log("No Map Data");
    }
}

inspectPost("nemrut-dagi-gundogumu");
