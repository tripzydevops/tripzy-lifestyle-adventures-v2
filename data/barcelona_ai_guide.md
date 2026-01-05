# Barcelona: Hyper-Local Secrets Beyond the Gaudi Trail

Barcelona pulses with an undercurrent of raw Mediterranean edge... [Content Truncated for this file]

---

## 🛠 TRIPZY METADATA (Internal Use)

This section is meant to be stored in the `metadata` column of your `blog.posts` table in Supabase. These fields drive the Autonomous Reasoning Engine.

| Field                  | Value                                 | Purpose                                                                  |
| :--------------------- | :------------------------------------ | :----------------------------------------------------------------------- |
| **Inferred Vibe**      | `Urban Rebel`                         | Used to find similar users and recommend this post to them.              |
| **Primary Constraint** | `Crowd Density`                       | Helps the engine know this post is a "solve" for people who hate crowds. |
| **UI Directive**       | `immersion`                           | Informs the frontend SDK to use a high-immersion, slow-read layout.      |
| **Keywords**           | `Catalan, Hidden, Underground, Local` | Used for vector embedding generation.                                    |

---

## Technical Guidance: How to use this meta

When you save this post in the admin panel, you should ensure the database record looks like this:

```json
{
  "title": "Barcelona: Hyper-Local Secrets",
  "content": "...(The Markdown)...",
  "metadata": {
    "vibe_persona": "Urban Rebel",
    "primary_constraint": "Crowd Density",
    "ui_directive": "immersion",
    "perplexity_sourced": true
  }
}
```

When a user reads this post, the `TripzyClient` will notice the `ui_directive` and can theoretically change the page's theme to match the vibe.
