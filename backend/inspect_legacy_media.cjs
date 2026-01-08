
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env');
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

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function main() {
    console.log("🔍 Inspeting 'blog.media' table (Manual Uploads?)...");

    // Select columns to avoid potential huge vectors if they exist
    const { data, error } = await supabase.schema('blog').from('media').select('id, filename, url, created_at').limit(10);

    if (error) {
        console.log("❌ Select Error on blog.media:", error);
    } else {
        console.log(`✅ blog.media contains ${data.length} rows.`);
        if (data.length > 0) console.log("Sample:", data[0]);
    }
}

main();
