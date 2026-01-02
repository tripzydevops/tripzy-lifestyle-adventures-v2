# 📐 Tripzy Intelligence Architecture Diagrams

> **Document Version:** 1.0  
> **Date:** January 2, 2026  
> **Description:** Visual representations of the Universal Plugin Architecture, Agent Workflows, and Data Pipelines to support the [Advanced Intelligence Roadmap](./advanced_intelligence_roadmap.md).

---

## 1. 🔌 The "Brain-in-a-Box" Integration Model

This diagram illustrates how the **Tripzy Intelligence SDK** plugs into _any_ Host Application (Travel, Real Estate, Finance) without tighter coupling.

```mermaid
graph TB
    subgraph "Host Application (Travel / Real Estate / Etc)"
        UI[User Interface]
        Context[Context Provider]
        GraphAdapter[Graph Adapter]
        Storage[Local/Edge Storage]
    end

    subgraph "Tripzy Intelligence SDK (The Plugin)"
        API[TripzyClient API]
        SignalBus[Signal Collection Bus]

        subgraph "Layer 2: The Council"
            Orchestrator[Agent Orchestrator]
            Profiler[User Profiler]
            Trendsetter[Trendsetter]
            Critic[Feasibility Critic]
        end

        subgraph "Layer 3: Memory"
            VectorDB[(Vector Database)]
            UserDB[(User Profiles)]
        end
    end

    %% Data Flows
    UI -- "User Actions (Clicks, Views)" --> SignalBus
    Context -- "World State (Weather, Prices)" --> Orchestrator
    GraphAdapter -- "Domain Nodes" --> Orchestrator

    SignalBus --> Profiler
    Profiler -- "Psychographic Vector" --> UserDB

    %% Request Flow
    UI -- "GetRecommendations(Query)" --> API
    API --> Orchestrator
    Orchestrator --> VectorDB
    VectorDB -- "Raw Matches" --> Orchestrator
    Orchestrator -- "Final Recs + UI Directive" --> API
    API --> UI
```

---

## 2. 🧠 The Multi-Agent "Council" Workflow

How a live user query is processed by the specialized agents in Layer 2.

```mermaid
sequenceDiagram
    participant User
    participant SDK as Tripzy SDK
    participant Profiler as 🕵️ Profiler
    participant Trendsetter as ⚡ Trendsetter
    participant Critic as ⚖️ Critic
    participant VectorDB as 📚 Vector DB

    User->>SDK: "I want a weekend getaway" (Query)

    par Parallel Analysis
        SDK->>Profiler: Get User "Soul" (Long-term Interest)
        Profiler-->>SDK: { "Loves": "Nature", "Hates": "Crowds" }

        SDK->>Trendsetter: Get Domain Trends
        Trendsetter-->>SDK: { "Trending": "Cabin Retreats", "Event": "Meteor Shower" }
    end

    SDK->>VectorDB: Semantic Search ("Nature" + "Cabin" + "Quiet")
    VectorDB-->>SDK: [Result A, Result B, Result C]

    loop For Each Result
        SDK->>Critic: Check Feasibility (Result, Weather, Price)
        Critic-->>SDK: Veto Result B (Too Expensive)
    end

    SDK->>User: Return [Result A, Result C] + UI Directive ("Immersion Mode")
```

---

## 3. 🌙 The "Dreaming" Cycle (Zero Latency)

How the system effectively "predicts the future" by running whilst the user sleeps.

```mermaid
graph LR
    subgraph "Nightly Cron Job (3:00 AM)"
        Scheduler[Scheduler]
        ActiveUsers[Get Active Users]
        Simulator[Dream Simulator]
    end

    subgraph "Intelligence Core"
        ProfileStore[(User Profiles)]
        ContentStore[(Content DB)]
    end

    subgraph "Delivery Edge"
        Redis[Redis / Edge Cache]
        AppUI[Host App UI]
    end

    Scheduler --> ActiveUsers
    ActiveUsers --> Simulator

    Simulator -- "Fetch History" --> ProfileStore
    Simulator -- "Fetch Candidates" --> ContentStore

    Simulator -- "Generate 'Morning Mix'" --> Redis

    %% The User Experience
    AppUI -- "User Opens App (8:00 AM)" --> Redis
    Redis -- "Instant Load (<100ms)" --> AppUI
```

---

## 4. 🧬 Generative UI Signal Flow

How the SDK controls the Host App's interface without rendering pixels itself (Headless UI).

```mermaid
stateDiagram-v2
    [*] --> Analyzing

    state "Analysis & Scoring" as Analysis {
        UserSignals --> DetectIntent
        DetectIntent --> DetermineVibe
    }

    DetermineVibe --> HighEnergy: Vibe = Bored/Skimming
    DetermineVibe --> Immersion: Vibe = Dreaming/Research
    DetermineVibe --> Utility: Vibe = Planning/Booking

    state "App UI Rendering (Host)" as UI {
        state HighEnergy {
            TikTokFeed --> VideoAutoplay
        }
        state Immersion {
            MagazineLayout --> SlowReveal
            MagazineLayout --> AmbientAudio
        }
        state Utility {
            ComparisonTable --> PriceHighlight
            MapView --> RouteOptimizer
        }
    }
```
