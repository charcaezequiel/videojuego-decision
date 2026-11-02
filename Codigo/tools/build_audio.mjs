/* =========================================================
   build_audio.js · Pasa musica-quiz.wav a .mp3
   El navegador reproduce MP3 en cualquier equipo y pesa ~8x menos
   que el WAV. El WAV queda como respaldo (y lo regenera build_music.py).
   Uso: node tools/build_audio.js
   ========================================================= */
import fs from 'fs';
import path from 'path';



const DIR = path.join(import.meta.dirname, '..', 'assets', 'audio');
const WAV = path.join(DIR, 'musica-quiz.wav');
const MP3 = path.join(DIR, 'musica-quiz.mp3');
const KBITS = 128;

function readWav(file){
  const b = fs.readFileSync(file);
  if(b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE') throw new Error('no es WAV');
  let p = 12, fmt = null, data = null;
  while(p + 8 <= b.length){
    const id = b.toString('ascii', p, p + 4);
    const size = b.readUInt32LE(p + 4);
    if(id === 'fmt ') fmt = {
      channels: b.readUInt16LE(p + 10),
      rate:     b.readUInt32LE(p + 12),
      bits:     b.readUInt16LE(p + 22)
    };
    if(id === 'data') data = b.slice(p + 8, p + 8 + size);
    p += 8 + size + (size % 2);
  }
  if(!fmt || !data) throw new Error('WAV sin fmt/data');
  return Object.assign(fmt, { data:data });
}

const { Mp3Encoder } = await import('@breezystack/lamejs');
const wav = readWav(WAV);
if(wav.bits !== 16) throw new Error('se esperaba WAV de 16 bits, llegó de ' + wav.bits);

/* PCM -> Int16 por canal */
const frames = Math.floor(wav.data.length / 2 / wav.channels);
const ch = [];
for(let c = 0; c < wav.channels; c++) ch.push(new Int16Array(frames));
for(let i = 0; i < frames; i++){
  for(let c = 0; c < wav.channels; c++){
    ch[c][i] = wav.data.readInt16LE((i * wav.channels + c) * 2);
  }
}

const enc = new Mp3Encoder(wav.channels, wav.rate, KBITS);
const BLOCK = 1152;
const out = [];
for(let i = 0; i < frames; i += BLOCK){
  const a = ch[0].subarray(i, i + BLOCK);
  const b = wav.channels > 1 ? ch[1].subarray(i, i + BLOCK) : null;
  const mp3 = b ? enc.encodeBuffer(a, b) : enc.encodeBuffer(a);
  if(mp3.length) out.push(Buffer.from(mp3));
}
const tail = enc.flush();
if(tail.length) out.push(Buffer.from(tail));

fs.writeFileSync(MP3, Buffer.concat(out));
console.log('musica-quiz.mp3  ' + (fs.statSync(MP3).size / 1024 / 1024).toFixed(2) + ' MB' +
  '  (antes ' + (fs.statSync(WAV).size / 1024 / 1024).toFixed(2) + ' MB de WAV)  ·  ' +
  (frames / wav.rate).toFixed(1) + ' s  ·  ' + wav.rate + ' Hz  ·  ' + wav.channels + ' ch  ·  ' + KBITS + ' kbps');
