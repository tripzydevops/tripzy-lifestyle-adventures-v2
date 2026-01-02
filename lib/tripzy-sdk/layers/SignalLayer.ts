import { IMemoryAdapter } from "./MemoryLayer";

export class SignalLayer {
  private memory: IMemoryAdapter;
  private sessionSignals: any[] = [];
  private sessionId: string;

  constructor(memory: IMemoryAdapter) {
    this.memory = memory;
    this.sessionId = this.generateSessionId();
  }

  public track(eventType: string, metadata: any = {}) {
    const signal = {
      type: eventType,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      data: metadata,
    };

    // 1. Buffer locally for immediate "Brain" access
    this.sessionSignals.push(signal);

    // 2. Persist to DB (Layer 3) asynchronously
    // In a real plugin, this would be batched
    this.memory.saveSignal(signal).catch((err) => {
      console.warn("Tripzy Signal Sync Error:", err);
    });
  }

  public getSessionSignals() {
    return this.sessionSignals;
  }

  private generateSessionId(): string {
    return "sess_" + Math.random().toString(36).substr(2, 9);
  }
}
