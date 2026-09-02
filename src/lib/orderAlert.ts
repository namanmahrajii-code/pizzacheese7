/**
 * Order Notification Sound & Alert Utility for 7Cheese POS Admin Panel
 * Plays a 3-second chime/bell alert whenever a new order is received.
 */

let audioCtx: AudioContext | null = null;
let activeGainNodes: GainNode[] = [];
let stopTimer: NodeJS.Timeout | null = null;
let persistentAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;

/**
 * Initializes or returns the shared AudioContext
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx || audioCtx.state === 'closed') {
    try {
      audioCtx = new AudioContextClass();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

/**
 * Returns a cached HTML5 Audio element pointing to /sounds/order-alert.wav
 */
export function getPersistentAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!persistentAudio) {
    try {
      persistentAudio = new Audio('/sounds/order-alert.wav');
      persistentAudio.preload = 'auto';
      persistentAudio.volume = 1.0;
    } catch {
      return null;
    }
  }
  return persistentAudio;
}

/**
 * Checks if browser audio subsystem has been unlocked
 */
export function isAudioSystemUnlocked(): boolean {
  if (typeof window === 'undefined') return true;
  if (audioUnlocked) return true;
  const ctx = getAudioContext();
  return ctx ? ctx.state === 'running' : false;
}

/**
 * Fully unlocks both Web Audio API and HTML5 Audio upon any user gesture
 */
export function unlockAudioContext(): void {
  if (typeof window === 'undefined') return;

  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      audioUnlocked = true;
    } catch {}
  }

  try {
    const audio = getPersistentAudio();
    if (audio) {
      audio.currentTime = 0;
      const p = audio.play();
      if (p !== undefined) {
        p.then(() => {
          audio.pause();
          audio.currentTime = 0;
          audioUnlocked = true;
        }).catch(() => {});
      }
    }
  } catch {}
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

  // Stop HTML5 Audio
  try {
    const audio = getPersistentAudio();
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  } catch {}

  // Fade out and disconnect active Web Audio nodes
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
 * Triggers both HTML5 Audio (/sounds/order-alert.wav) and Web Audio API synthesis for 100% reliability.
 */
export async function playOrderAlert(durationMs = 3000): Promise<void> {
  if (!isSoundAlertEnabled()) return;

  stopOrderAlert();

  // 1. Trigger HTML5 Audio immediately
  try {
    const audio = getPersistentAudio();
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('HTML5 Audio play warning:', err);
        });
      }
    }
  } catch (err) {
    console.warn('HTML5 Audio error:', err);
  }

  // 2. Concurrently synthesize Web Audio chime
  const ctx = getAudioContext();
  if (ctx) {
    try {
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }

      if (ctx.state === 'running') {
        const startTime = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.8, startTime);
        masterGain.connect(ctx.destination);
        activeGainNodes.push(masterGain);

        const scheduleBellChime = (
          freq: number,
          startOffset: number,
          duration: number,
          volume = 0.5
        ) => {
          const t0 = startTime + startOffset;

          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t0);

          const overtone = ctx.createOscillator();
          const overtoneGain = ctx.createGain();
          overtone.type = 'sine';
          overtone.frequency.setValueAtTime(freq * 2, t0);

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

        // Chime burst 1 (0.0s - 0.75s)
        scheduleBellChime(880, 0.0, 0.35, 0.55);
        scheduleBellChime(1174.66, 0.22, 0.55, 0.65);

        // Chime burst 2 (1.0s - 1.75s)
        scheduleBellChime(880, 1.0, 0.35, 0.55);
        scheduleBellChime(1174.66, 1.22, 0.55, 0.65);

        // Chime burst 3 (2.0s - 3.0s) - Resolution chord
        scheduleBellChime(1046.5, 2.0, 0.98, 0.55);
        scheduleBellChime(1318.5, 2.0, 0.98, 0.45);
        scheduleBellChime(1568.0, 2.0, 0.98, 0.35);
      }
    } catch (e) {
      console.warn('Web Audio synthesis warning:', e);
    }
  }

  // Exactly stop at durationMs (3000ms)
  stopTimer = setTimeout(() => {
    stopOrderAlert();
  }, durationMs);
}

/**
 * Requests browser desktop notification permissions if supported
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
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
