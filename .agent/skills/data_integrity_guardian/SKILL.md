# Skill: Data Integrity Guardian

**Mission**: Maintain 100% data consistency for Tripzy.travel across Supabase, Vector Stores, and Media Storage.

## Overview

This skill automates the detection and repair of data anomalies that occur during the R&D and scaling phases of the Reasoning Engine.

## Procedures

### 1. Daily Health Audit

- **Filesystem**: Check for orphaned media files in storage.
- **Database**: Check for posts missing content, meta-tags, or map data.
- **Vector**: Verify that all published posts have valid embeddings.
- **Localization**: Ensure both TR and EN keys exist for all UI elements.

### 2. Autonomous Repair

- If a post is missing images, trigger `repair_content.py`.
- If storage and DB are out of sync, trigger `sync_storage_to_db.py`.
- If schema drift is detected, flag for lead developer review.

## Knowledge Base

- **Supabase Schema**: `public` and `blog` schemas are primary.
- **Media Bucket**: `blog-media` is the source of truth for assets.
- **Critical Table**: `blog.media` linked to `media_library`.
