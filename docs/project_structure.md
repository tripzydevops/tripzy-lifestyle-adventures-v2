# Tripzy Project Structure

Your project is currently set up as a **Monorepo** (Monolithic Repository). This means all parts of your application live in one folder. This is standard practice for modern full-stack development because it makes sharing code and managing the project much easier.

Here is the map of your folder:

```mermaid
graph TD
    Root[📂 Tripzy Root Folder] --> Web[🌐 Web App (React)]
    Root --> Mobile[📱 Mobile App (React Native)]
    Root --> Backend[🧠 AI Backend (Python)]
    Root --> DB[fw Database (Supabase)]

    Web --> P[pages/ & components/]
    Mobile --> M[mobile/]
    Backend --> B[backend/]
    DB --> S[supabase/]
```

## 1. 🌐 The Web App (Root)

- **Location**: The root folder (`/`), plus `pages/`, `components/`, `lib/`.
- **Purpose**: This is the website (`tripzy.travel`) that people visit in Chrome/Safari.
- **Run command**: `npm run dev`

## 2. 📱 The Mobile App

- **Location**: `mobile/`
- **Purpose**: This is the iPhone/Android app users download from the App Store. It is completely self-contained in this folder.
- **Run command**: `cd mobile && npx expo start`

## 3. 🧠 The AI Backend

- **Location**: `backend/`
- **Purpose**: The "Brain" that processes logic and talks to Google Gemini. Both the Web App and Mobile App talk to this API.
- **Run command**: `fastapi dev backend/main.py`

## 4. 🗄️ The Database

- **Location**: `supabase/`
- **Purpose**: Stores all SQL migrations and database configuration.

---

### FAQ: Can I separate them?

**Yes!** Because `mobile` and `backend` are in their own folders, you can drag-and-drop them into new folders later if you want to split them up.

- To move the mobile app: Just move the `mobile/` folder to a new location (e.g., `Documents/TripzyMobile`) and run it there. It works independently!
