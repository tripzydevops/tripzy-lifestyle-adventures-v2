import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export type SignalEventType = 'view' | 'click' | 'hover' | 'search' | 'language_change' | 'scroll' | 'time_spent';

export interface UserSignal {
  event_type: SignalEventType;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, any>;
  user_id?: string;
  session_id?: string;
}

class SignalService {
  private buffer: UserSignal[] = [];
  private sessionId: string;
  private flushInterval: number = 10000; // Flush every 10 seconds
  private maxBufferSize: number = 50;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.startTimer();
    
    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return '';
    let sid = sessionStorage.getItem('tripzy_session_id');
    if (!sid) {
      sid = uuidv4();
      sessionStorage.setItem('tripzy_session_id', sid);
    }
    return sid;
  }

  private startTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  public track(signal: UserSignal) {
    const enrichedSignal = {
      ...signal,
      session_id: this.sessionId,
      created_at: new Date().toISOString(),
    };

    this.buffer.push(enrichedSignal);

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  public async flush() {
    if (this.buffer.length === 0) return;

    const signalsToFlush = [...this.buffer];
    this.buffer = [];

    try {
      const { error } = await supabase
        .schema('blog')
        .from('user_signals')
        .insert(signalsToFlush);

      if (error) {
        console.error('Failed to flush signals:', error);
        // Put back in buffer if failed? (maybe limited retry)
        this.buffer = [...signalsToFlush, ...this.buffer].slice(0, this.maxBufferSize * 2);
      }
    } catch (err) {
      console.error('Error flushing signals:', err);
    }
  }
}

export const signalService = new SignalService();
