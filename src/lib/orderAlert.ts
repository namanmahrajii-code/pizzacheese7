/**
 * Order Notification Sound & Alert Utility for 7Cheese POS Admin Panel
 * Plays a 3-second chime/bell alert whenever a new order is received.
 */

let audioCtx: AudioContext | null = null;
let activeGainNodes: GainNode[] = [];
let stopTimer: NodeJS.Timeout | null = null;

/**
 * Initializes or returns the shared AudioContext
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

/**
 * Ensures AudioContext is unlocked upon user interaction (click, keypress, etc.)
 */
export function unlockAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/**
 * Checks if sound alert is enabled in Admin settings
 */
export function isSoundAlertEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem('7cheese_admin_sound_alert');
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

/**
 * Toggles or sets sound alert enabled state
 */
export function setSoundAlertEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('7cheese_admin_sound_alert', enabled ? 'true' : 'false');
  } catch {}
}

/**
 * Stops any currently playing alert chime
 */
export function stopOrderAlert(): void {
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }

  // Fade out active gain nodes
  activeGainNodes.forEach((gain) => {
    try {
      const now = gain.context.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
    } catch {}
  });
  activeGainNodes = [];
}

/**
 * Plays a high-fidelity, 3-second kitchen POS order alert chime.
 * Uses Web Audio API synthesis with HTML5 Audio fallback.
 *
 * Pattern:
 * - 0.0s - 0.7s: Chime 1 (G5 784Hz -> C6 1046.5Hz)
 * - 1.0s - 1.7s: Chime 2 (A5 880Hz -> D6 1174.66Hz)
 * - 2.0s - 3.0s: Chime 3 (Harmonic chord C6 1046.5Hz + E6 1318.5Hz), fading to 0 at exactly 3.0s.
 */
export async function playOrderAlert(durationMs = 3000): Promise<void> {
  if (!isSoundAlertEnabled()) return;

  stopOrderAlert();

  const ctx = getAudioContext();

  // Try Web Audio API first (instant, zero network latency)
  if (ctx) {
    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const startTime = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.75, startTime);
      masterGain.connect(ctx.destination);
      activeGainNodes.push(masterGain);

      // Helper to schedule a bell chime with fundamental and overtone
      const scheduleBellChime = (
        freq: number,
        startOffset: number,
        duration: number,
        volume = 0.5
      ) => {
        const t0 = startTime + startOffset;

        // Fundamental oscillator
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t0);

        // Overtone oscillator for warm restaurant bell timbre
        const overtone = ctx.createOscillator();
        const overtoneGain = ctx.createGain();
        overtone.type = 'sine';
        overtone.frequency.setValueAtTime(freq * 2, t0);

        // Envelope: immediate strike, exponential decay
        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

        overtoneGain.gain.setValueAtTime(0.001, t0);
        overtoneGain.gain.exponentialRampToValueAtTime(volume * 0.35, t0 + 0.02);
        overtoneGain.gain.exponentialRampToValueAtTime(0.001, t0 + duration * 0.7);

        osc.connect(gain);
        overtone.connect(overtoneGain);
        gain.connect(masterGain);
        overtoneGain.connect(masterGain);

        osc.start(t0);
        osc.stop(t0 + duration);
        overtone.start(t0);
        overtone.stop(t0 + duration);
      };

      // Burst 1 (0.0s - 0.75s)
      scheduleBellChime(784, 0.0, 0.35, 0.5);
      scheduleBellChime(1046.5, 0.22, 0.55, 0.6);

      // Burst 2 (1.0s - 1.75s)
      scheduleBellChime(880, 1.0, 0.35, 0.5);
      scheduleBellChime(1174.66, 1.22, 0.55, 0.6);

      // Burst 3 (2.0s - 3.0s) - Rich resolution chord
      scheduleBellChime(1046.5, 2.0, 0.98, 0.5);
      scheduleBellChime(1318.5, 2.0, 0.98, 0.4);
      scheduleBellChime(1568.0, 2.0, 0.98, 0.3);

      // Smoothly cutoff at durationMs (default 3000ms)
      stopTimer = setTimeout(() => {
        stopOrderAlert();
      }, durationMs);

      return;
    } catch (e) {
      console.warn('Web Audio playback error, trying HTML5 Audio fallback:', e);
    }
  }

  // Fallback: HTML5 Audio with generated 3-second WAV
  try {
    const audio = new Audio('/sounds/order-alert.wav');
    audio.volume = 0.85;
    audio.play().catch((err) => {
      console.warn('HTML5 audio play blocked:', err);
    });

    stopTimer = setTimeout(() => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
    }, durationMs);
  } catch (err) {
    console.error('All audio playback methods failed:', err);
  }
}

/**
 * Requests browser desktop notification permissions if supported
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

/**
 * Fires a native OS notification for incoming orders
 */
export function fireDesktopNotification(order: {
  id: string;
  customerName?: string;
  totalAmount?: number;
  deliveryType?: string;
  tableNumber?: string | null;
}): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const orderTitle = `🔔 New ${order.deliveryType || 'Order'} #${order.id}!`;
    const orderBody = order.tableNumber
      ? `Table #${order.tableNumber} • ₹${order.totalAmount || 0} • ${order.customerName || 'Customer'}`
      : `₹${order.totalAmount || 0} • ${order.customerName || 'Customer'}`;

    const notif = new Notification(orderTitle, {
      body: orderBody,
      icon: '/cheese.png',
      tag: `order-${order.id}`,
      requireInteraction: false,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (err) {
    console.warn('Desktop notification error:', err);
  }
}
