
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually parse .env without external dependencies
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envFile.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, ''); // Remove quotes
                if (key && !key.startsWith('#')) {
                    process.env[key] = value;
                }
            }
        });
    } catch (err) {
        console.warn("Warning: Could not read .env file:", err.message);
    }
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Error: Missing Supabase Env Vars. Make sure .env is accessible.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function auditMedia() {
    console.log("--- 🔍 Auditing Media Library (Node.js) ---");

    // 1. Fetch Media
    const { data: mediaItems, error, count } = await supabase
        .from('media_library') // Confirmed table name from migration 011
        .select('*', { count: 'exact' });

    if (error) {
        // Retry with specific schema if public failed
        if (error.code === '42P01') { // undefined_table
            console.log("Table not found in default (public) schema, trying 'blog' schema...");
            const { data: blogMedia, error: blogError, count: blogCount } = await supabase
                .schema('blog')
                .from('media')
                .select('*', { count: 'exact' });

            if (blogError) {
                console.error("Error querying blog.media:", blogError);
                return;
            }
            processResults(blogMedia, blogCount);
            return;
        }
        console.error("Error querying media:", error);
        return;
    }

    processResults(mediaItems, count);
}

function processResults(items, total) {
    if (!items || items.length === 0) {
        console.log("No media found.");
        return;
    }

    let missingAlt = 0;

    items.forEach(item => {
        const alt = item.alt_text || "";
        if (alt.length < 5) {
            missingAlt++;
        }
    });

    console.log(`\n--- Results ---`);
    console.log(`Total Items: ${total}`);
    console.log(`❌ Missing/Weak Alt Text: ${missingAlt} / ${items.length} (${((missingAlt / items.length) * 100).toFixed(1)}%)`);

    if (missingAlt > 0) {
        console.log("\nRecommendation: We need to auto-label these images.");
    } else {
        console.log("\n✅ All images look labeled!");
    }
}

auditMedia();
