// Tiny stack VM, make.fun tiny-stack-vm-01 (ISA v1): 32-bit wrapping ints,
// 256-value stack, 64-deep call stack, 256 memory words, 1e6 steps,
// 65536 output bytes, ten traps with their own exit codes.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const T = new Int8Array(256).fill(-1), S = (o, i, a, b) => { T[o] = i | a << 3 | b << 5; };
S(0, 0, 0, 0); S(1, 1, 0, 1); S(2, 4, 0, 1); S(3, 0, 1, 0); S(4, 0, 1, 2); S(5, 0, 2, 2); S(6, 0, 2, 3); S(7, 0, 3, 3);
for (let o = 16; o <= 34; o++) S(o, 0, 2, 1);
S(23, 0, 1, 1); S(27, 0, 1, 1);
S(48, 2, 0, 0); S(49, 2, 1, 0); S(50, 2, 1, 0); S(51, 2, 0, 0); S(52, 0, 0, 0);
S(64, 0, 1, 1); S(65, 0, 2, 0); S(80, 0, 1, 0); S(81, 0, 1, 0); S(82, 0, 0, 1); S(83, 0, 1, 0);
const dg = new Uint8Array(12);
function run(p, q) {
  const n = p.length, D = new Int32Array(256), C = new Int32Array(64), M = new Int32Array(256), o = new Uint8Array(65536);
  let s = 0, c = 0, l = 0, j = 0, k = 0, t = 0;
  const e = x => ({ out: o.slice(0, l), code: x });
  for (;;) {
    if (t === 1e6) return e(10);
    if (k < 0 || k >= n) return e(9);
    const op = p[k], v = T[op];
    if (v < 0) return e(5);
    const im = v & 7;
    if (k + im >= n) return e(9);
    t++;
    const nx = k + 1 + im, pp = v >> 3 & 3, qq = v >> 5 & 3;
    if (s < pp) return e(2);
    if (s - pp + qq > 256) return e(3);
    k = nx;
    switch (op) {
      case 0: return e(0);
      case 1: D[s++] = p[nx - 1] << 24 >> 24; break;
      case 2: D[s++] = p[nx - 4] | p[nx - 3] << 8 | p[nx - 2] << 16 | p[nx - 1] << 24; break;
      case 3: s--; break;
      case 4: D[s] = D[s - 1]; s++; break;
      case 5: { const a = D[s - 1]; D[s - 1] = D[s - 2]; D[s - 2] = a; break; }
      case 6: D[s] = D[s - 2]; s++; break;
      case 7: { const a = D[s - 3]; D[s - 3] = D[s - 2]; D[s - 2] = D[s - 1]; D[s - 1] = a; break; }
      case 23: D[s - 1] = -D[s - 1] | 0; break;
      case 27: D[s - 1] = ~D[s - 1]; break;
      case 16: case 17: case 18: case 19: case 20: case 21: case 22:
      case 24: case 25: case 26: case 28: case 29: case 30:
      case 32: case 33: case 34: {
        const b = D[s - 1], a = D[s - 2];
        let r;
        if (op === 16) r = a + b | 0;
        else if (op === 17) r = a - b | 0;
        else if (op === 18) r = Math.imul(a, b);
        else if (op === 19) { if (!b) return e(4); r = a === -2147483648 && b === -1 ? a : a / b | 0; }
        else if (op === 20) { if (!b) return e(4); r = b === -1 ? 0 : a % b | 0; }
        else if (op === 21) { if (!b) return e(4); r = Math.floor((a >>> 0) / (b >>> 0)) | 0; }
        else if (op === 22) { if (!b) return e(4); r = (a >>> 0) % (b >>> 0) | 0; }
        else if (op === 24) r = a & b;
        else if (op === 25) r = a | b;
        else if (op === 26) r = a ^ b;
        else if (op === 28) r = a << (b & 31);
        else if (op === 29) r = a >> (b & 31);
        else if (op === 30) r = a >>> (b & 31) | 0;
        else if (op === 32) r = a === b ? 1 : 0;
        else if (op === 33) r = a < b ? 1 : 0;
        else r = (a >>> 0) < (b >>> 0) ? 1 : 0;
        s -= 2; D[s++] = r;
        break;
      }
      case 48: case 49: case 50: {
        const rel = (p[nx - 2] | p[nx - 1] << 8) << 16 >> 16;
        let take = true;
        if (op !== 48) { const v = D[--s]; take = op === 49 ? v === 0 : v !== 0; }
        if (take) k = nx + rel;
        break;
      }
      case 51:
        if (c === 64) return e(7);
        C[c++] = nx; k = p[nx - 2] | p[nx - 1] << 8; break;
      case 52:
        if (!c) return e(8);
        k = C[--c]; break;
      case 64: {
        const a = D[s - 1];
        if (a < 0 || a >= 256) return e(6);
        D[s - 1] = M[a]; break;
      }
      case 65: {
        const a = D[s - 1], v = D[s - 2];
        if (a < 0 || a >= 256) return e(6);
        s -= 2; M[a] = v; break;
      }
      case 80: {
        let v = D[s - 1], u = v < 0 ? -v : v, d = 0;
        do { dg[d++] = 48 + u % 10; u = Math.floor(u / 10); } while (u > 0);
        const ln = d + (v < 0 ? 1 : 0);
        if (l + ln > 65536) return e(11);
        s--;
        if (v < 0) o[l++] = 45;
        while (d > 0) o[l++] = dg[--d];
        break;
      }
      case 81:
        if (l + 1 > 65536) return e(11);
        o[l++] = D[--s] & 255; break;
      case 82: D[s++] = j < q.length ? q[j++] : -1; break;
      case 83: return e(D[--s] & 255);
    }
  }
}
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input', O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const id of readdirSync(I).sort()) {
  const r = run(new Uint8Array(readFileSync(join(I, id, 'program.bin'))), new Uint8Array(readFileSync(join(I, id, 'input.bin'))));
  mkdirSync(join(O, id), { recursive: true });
  writeFileSync(join(O, id, 'stdout.bin'), r.out);
  writeFileSync(join(O, id, 'exit.txt'), r.code + '\n');
}
