import { IMemoryAdapter } from "./MemoryLayer";

export class SignalLayer {
  private memory: IMemoryAdapter;
  private sessionSignals: any[] = [];
  private buffer: any[] = [];
  private sessionId: string;
  private flushTimer: any;
  private readonly BATCH_SIZE = 5;
  private readonly FLUSH_INTERVAL = 3000; // 3 seconds

  constructor(memory: IMemoryAdapter) {
    this.memory = memory;
    this.sessionId = this.generateSessionId();

    // Start auto-flush timer
    this.flushTimer = setInterval(() => this.flush(), this.FLUSH_INTERVAL);
  }

  public track(eventType: string, metadata: any = {}) {
    // Enrich with context if in browser
    const context =
      typeof window !== "undefined"
        ? {
            url: window.location.href,
            path: window.location.pathname,
            referrer: document.referrer,
            ...metadata,
          }
        : metadata;

    const signal = {
      type: eventType,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      data: context,
    };

    // 1. Buffer locally for immediate "Brain" access
    this.sessionSignals.push(signal);

    // 2. Add to upload buffer
    this.buffer.push(signal);

    // 3. Flush if buffer is full
    if (this.buffer.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const batch = [...this.buffer];
    this.buffer = []; // Clear buffer immediately to prevent double-send

    try {
      await this.memory.saveSignals(batch);
    } catch (err) {
      console.warn("Tripzy Signal Sync Error:", err);
      // Optional: Re-queue failed batch? ignoring for now to prevent loops
    }
  }

  public getSessionSignals() {
    return this.sessionSignals;
  }

  private generateSessionId(): string {
    return "sess_" + Math.random().toString(36).substr(2, 9);
  }
}
