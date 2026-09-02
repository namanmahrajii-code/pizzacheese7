const fs = require('fs');
const path = require('path');

const sampleRate = 44100;
const duration = 3.0; // 3 seconds
const numSamples = Math.floor(sampleRate * duration);
const numChannels = 1;
const bytesPerSample = 2; // 16-bit
const blockAlign = numChannels * bytesPerSample;
const byteRate = sampleRate * blockAlign;
const dataSize = numSamples * blockAlign;

const buffer = Buffer.alloc(44 + dataSize);

// Write WAV header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
buffer.writeUInt16LE(numChannels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(byteRate, 28);
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(bytesPerSample * 8, 34); // BitsPerSample
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

// Tone parameters: 3 chime sequences (at 0s, 1s, 2s)
// Each chime has a root note and an overtone, decaying with exponential envelope
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate; // time in seconds
  let sample = 0;

  // Burst 1: 0.0s to 0.8s (Notes: 784 Hz [G5] then 1046.5 Hz [C6])
  if (t >= 0 && t < 0.8) {
    const burstT = t;
    if (burstT < 0.25) {
      const env = Math.exp(-burstT * 8);
      sample += 0.45 * Math.sin(2 * Math.PI * 784 * burstT) * env;
      sample += 0.2 * Math.sin(2 * Math.PI * 1568 * burstT) * env; // Harmonic
    } else {
      const subT = burstT - 0.25;
      const env = Math.exp(-subT * 6);
      sample += 0.5 * Math.sin(2 * Math.PI * 1046.5 * subT) * env;
      sample += 0.25 * Math.sin(2 * Math.PI * 2093 * subT) * env;
    }
  }

  // Burst 2: 1.0s to 1.8s (Notes: 880 Hz [A5] then 1174.66 Hz [D6])
  if (t >= 1.0 && t < 1.8) {
    const burstT = t - 1.0;
    if (burstT < 0.25) {
      const env = Math.exp(-burstT * 8);
      sample += 0.45 * Math.sin(2 * Math.PI * 880 * burstT) * env;
      sample += 0.2 * Math.sin(2 * Math.PI * 1760 * burstT) * env;
    } else {
      const subT = burstT - 0.25;
      const env = Math.exp(-subT * 6);
      sample += 0.5 * Math.sin(2 * Math.PI * 1174.66 * subT) * env;
      sample += 0.25 * Math.sin(2 * Math.PI * 2349.32 * subT) * env;
    }
  }

  // Burst 3: 2.0s to 3.0s (Triumphant final chord: 1046.5 Hz [C6] + 1318.5 Hz [E6])
  if (t >= 2.0 && t < 3.0) {
    const burstT = t - 2.0;
    const env = Math.exp(-burstT * 3.5) * (1 - burstT / 1.0); // smooth zero at 3.0s
    sample += 0.4 * Math.sin(2 * Math.PI * 1046.5 * burstT) * Math.max(0, env);
    sample += 0.35 * Math.sin(2 * Math.PI * 1318.51 * burstT) * Math.max(0, env);
    sample += 0.2 * Math.sin(2 * Math.PI * 1568 * burstT) * Math.max(0, env);
  }

  // Master fade out at the very end of 3.0s
  if (t > 2.85) {
    const fade = Math.max(0, (3.0 - t) / 0.15);
    sample *= fade;
  }

  // Clamp and convert to 16-bit PCM integer
  const clamped = Math.max(-1, Math.min(1, sample));
  const intVal = Math.floor(clamped * 32767);
  buffer.writeInt16LE(intVal, 44 + i * 2);
}

const outDir = path.join(__dirname, '..', 'public', 'sounds');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outFile = path.join(outDir, 'order-alert.wav');
fs.writeFileSync(outFile, buffer);
console.log(`Generated 3-second alert tone at: ${outFile} (${buffer.length} bytes)`);
