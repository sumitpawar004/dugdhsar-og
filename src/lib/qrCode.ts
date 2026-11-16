/**
 * DUGDHSAR Pure TypeScript QR Code Engine (ISO/IEC 18004 Byte Mode, Error Correction Level M)
 * Generates authentic scannable QR matrices for daily orders & doorstep subscription deliveries
 * with zero heavy third-party dependencies and zero SVG elements.
 */

export interface ParsedDeliveryQr {
  orderId: string;
  token: string;
  deliveryDate?: string;
}

// Generate cryptographically random URL-safe verification token
export function generateUniqueQrToken(seed = ''): string {
  const randomBytes = new Uint8Array(12);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < randomBytes.length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const cleanSeed = seed.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  return `DQR_${cleanSeed ? cleanSeed + '_' : ''}${hex}`;
}

// Construct canonical verification URL encoded inside every order QR code
export function buildDeliveryVerifyUrl(
  origin: string,
  orderId: string,
  token: string,
  deliveryDate?: string
): string {
  const base = (origin || 'https://dugdhsar.in').replace(/\/$/, '');
  const params = new URLSearchParams();
  params.set('orderId', orderId);
  params.set('token', token);
  if (deliveryDate) {
    params.set('date', deliveryDate);
  }
  return `${base}/delivery/verify?${params.toString()}`;
}

// Parse QR scan string (URL, JSON, or ORDER:TOKEN format)
export function parseQrPayload(rawText: string): ParsedDeliveryQr | null {
  const trimmed = (rawText || '').trim();
  if (!trimmed) return null;

  // 1. URL format (?orderId=...&token=...&date=...)
  if (trimmed.includes('orderId=') && trimmed.includes('token=')) {
    try {
      const normalized = trimmed.startsWith('http')
        ? trimmed
        : `https://dugdhsar.in${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
      const url = new URL(normalized);
      const orderId = url.searchParams.get('orderId') || url.searchParams.get('id') || '';
      const token = url.searchParams.get('token') || '';
      const deliveryDate = url.searchParams.get('date') || undefined;
      if (orderId && token) {
        return { orderId: orderId.trim(), token: token.trim(), deliveryDate };
      }
    } catch {
      // fall through
    }
  }

  // 2. JSON format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj.orderId && obj.token) {
        return {
          orderId: String(obj.orderId).trim(),
          token: String(obj.token).trim(),
          deliveryDate: obj.deliveryDate || obj.date || undefined,
        };
      }
    } catch {
      // fall through
    }
  }

  // 3. Pipe or Colon separated format: ORDER_ID|TOKEN
  if (trimmed.includes('|')) {
    const [orderId, token, deliveryDate] = trimmed.split('|').map((s) => s.trim());
    if (orderId && token) {
      return { orderId, token, deliveryDate: deliveryDate || undefined };
    }
  }

  return null;
}

// =========================================================================
// GF(256) Galois Field & Reed-Solomon Error Correction (Polynomial 0x11D)
// =========================================================================
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    EXP_TABLE[i + 255] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]];
}

function rsGeneratorPoly(ecCount: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < ecCount; i++) {
    const factor = new Uint8Array([1, EXP_TABLE[i]]);
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      for (let k = 0; k < factor.length; k++) {
        next[j + k] ^= gfMul(poly[j], factor[k]);
      }
    }
    poly = next;
  }
  return poly;
}

function rsComputeEc(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsGeneratorPoly(ecCount);
  const work = new Uint8Array(data.length + ecCount);
  work.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = work[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        work[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return work.slice(data.length);
}

// Version specifications for EC Level M (Versions 1 to 10)
interface VersionSpec {
  version: number;
  size: number;
  dataCodewords: number;
  ecPerBlock: number;
  blocksGroup1: number;
  dataPerBlock1: number;
  blocksGroup2: number;
  dataPerBlock2: number;
  alignments: number[];
}

const VERSION_SPECS_M: VersionSpec[] = [
  { version: 1, size: 21, dataCodewords: 16, ecPerBlock: 10, blocksGroup1: 1, dataPerBlock1: 16, blocksGroup2: 0, dataPerBlock2: 0, alignments: [] },
  { version: 2, size: 25, dataCodewords: 28, ecPerBlock: 16, blocksGroup1: 1, dataPerBlock1: 28, blocksGroup2: 0, dataPerBlock2: 0, alignments: [6, 18] },
  { version: 3, size: 29, dataCodewords: 44, ecPerBlock: 26, blocksGroup1: 1, dataPerBlock1: 44, blocksGroup2: 0, dataPerBlock2: 0, alignments: [6, 22] },
  { version: 4, size: 33, dataCodewords: 64, ecPerBlock: 18, blocksGroup1: 2, dataPerBlock1: 32, blocksGroup2: 0, dataPerBlock2: 0, alignments: [6, 26] },
  { version: 5, size: 37, dataCodewords: 86, ecPerBlock: 24, blocksGroup1: 2, dataPerBlock1: 43, blocksGroup2: 0, dataPerBlock2: 0, alignments: [6, 30] },
  { version: 6, size: 41, dataCodewords: 108, ecPerBlock: 16, blocksGroup1: 4, dataPerBlock1: 27, blocksGroup2: 0, dataPerBlock2: 0, alignments: [6, 34] },
  { version: 7, size: 45, dataCodewords: 124, ecPerBlock: 18, blocksGroup1: 4, dataPerBlock1: 31, blocksGroup2: 0, dataPerBlock2: 0, alignments: [6, 22, 38] },
  { version: 8, size: 49, dataCodewords: 154, ecPerBlock: 22, blocksGroup1: 2, dataPerBlock1: 38, blocksGroup2: 2, dataPerBlock2: 39, alignments: [6, 24, 42] },
  { version: 9, size: 53, dataCodewords: 182, ecPerBlock: 22, blocksGroup1: 3, dataPerBlock1: 36, blocksGroup2: 2, dataPerBlock2: 37, alignments: [6, 26, 46] },
  { version: 10, size: 57, dataCodewords: 216, ecPerBlock: 26, blocksGroup1: 4, dataPerBlock1: 43, blocksGroup2: 1, dataPerBlock2: 44, alignments: [6, 28, 50] },
];

// BCH(15,5) format bits for Level M (00) + mask 0..7 XOR 0x5412
const FORMAT_INFO_M = [
  0x5412 ^ 0x0000, // placeholder replaced below with exact precomputed values
];
void FORMAT_INFO_M;

function computeFormatInfoBits(mask: number): number {
  const ecBits = 0b00; // EC Level M = 00
  const data = (ecBits << 3) | (mask & 0b111);
  let rem = data << 10;
  const gen = 0b10100110111;
  for (let i = 14; i >= 10; i--) {
    if ((rem >> i) & 1) {
      rem ^= gen << (i - 10);
    }
  }
  return ((data << 10) | rem) ^ 0x5412;
}

function computeVersionInfoBits(version: number): number {
  let rem = version << 12;
  const gen = 0b1111100100101;
  for (let i = 17; i >= 12; i--) {
    if ((rem >> i) & 1) {
      rem ^= gen << (i - 12);
    }
  }
  return (version << 12) | rem;
}

function utf8Bytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function encodeDataBits(bytes: Uint8Array, spec: VersionSpec): number[] {
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  };

  // Mode: Byte = 0100
  pushBits(0b0100, 4);
  // Count length: 8 bits for versions 1-9, 16 bits for version 10+
  const countLen = spec.version >= 10 ? 16 : 8;
  pushBits(bytes.length, countLen);

  for (let i = 0; i < bytes.length; i++) {
    pushBits(bytes[i], 8);
  }

  const capacityBits = spec.dataCodewords * 8;
  const terminatorLen = Math.min(4, capacityBits - bits.length);
  for (let i = 0; i < terminatorLen; i++) bits.push(0);

  while (bits.length % 8 !== 0) bits.push(0);

  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < capacityBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  return bits;
}

function buildCodewords(bytes: Uint8Array, spec: VersionSpec): Uint8Array {
  const bits = encodeDataBits(bytes, spec);
  const rawCodewords = new Uint8Array(spec.dataCodewords);
  for (let i = 0; i < spec.dataCodewords; i++) {
    let b = 0;
    for (let bit = 0; bit < 8; bit++) {
      b = (b << 1) | bits[i * 8 + bit];
    }
    rawCodewords[i] = b;
  }

  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;

  for (let i = 0; i < spec.blocksGroup1; i++) {
    const block = rawCodewords.slice(offset, offset + spec.dataPerBlock1);
    offset += spec.dataPerBlock1;
    dataBlocks.push(block);
    ecBlocks.push(rsComputeEc(block, spec.ecPerBlock));
  }
  for (let i = 0; i < spec.blocksGroup2; i++) {
    const block = rawCodewords.slice(offset, offset + spec.dataPerBlock2);
    offset += spec.dataPerBlock2;
    dataBlocks.push(block);
    ecBlocks.push(rsComputeEc(block, spec.ecPerBlock));
  }

  const interleaved: number[] = [];
  const maxDataLen = Math.max(spec.dataPerBlock1, spec.dataPerBlock2);
  for (let i = 0; i < maxDataLen; i++) {
    for (const block of dataBlocks) {
      if (i < block.length) interleaved.push(block[i]);
    }
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (const block of ecBlocks) {
      if (i < block.length) interleaved.push(block[i]);
    }
  }

  return new Uint8Array(interleaved);
}

function maskBit(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0: return (r + c) % 2 === 0;
    case 1: return r % 2 === 0;
    case 2: return c % 3 === 0;
    case 3: return (r + c) % 3 === 0;
    case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5: return ((r * c) % 2 + (r * c) % 3) === 0;
    case 6: return (((r * c) % 2 + (r * c) % 3) % 2) === 0;
    case 7: return (((r + c) % 2 + (r * c) % 3) % 2) === 0;
    default: return false;
  }
}

function createBaseMatrix(spec: VersionSpec): { modules: Int8Array[]; isFunction: boolean[][] } {
  const n = spec.size;
  const modules = Array.from({ length: n }, () => new Int8Array(n));
  const isFunction = Array.from({ length: n }, () => Array<boolean>(n).fill(false));

  const setFunc = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < n && c >= 0 && c < n) {
      modules[r][c] = dark ? 1 : 0;
      isFunction[r][c] = true;
    }
  };

  // 1. Finder patterns + separators
  const drawFinder = (top: number, left: number) => {
    for (let dy = -1; dy <= 7; dy++) {
      for (let dx = -1; dx <= 7; dx++) {
        const r = top + dy;
        const c = left + dx;
        if (r < 0 || r >= n || c < 0 || c >= n) continue;
        const dist = Math.max(Math.abs(dy - 3), Math.abs(dx - 3));
        const dark = dist !== 2 && dist <= 3;
        setFunc(r, c, dark);
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, n - 7);
  drawFinder(n - 7, 0);

  // 2. Alignment patterns
  const align = spec.alignments;
  for (let i = 0; i < align.length; i++) {
    for (let j = 0; j < align.length; j++) {
      // Skip finder overlaps
      if ((i === 0 && j === 0) || (i === 0 && j === align.length - 1) || (i === align.length - 1 && j === 0)) {
        continue;
      }
      const cy = align[i];
      const cx = align[j];
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const dist = Math.max(Math.abs(dy), Math.abs(dx));
          setFunc(cy + dy, cx + dx, dist !== 1);
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < n - 8; i++) {
    if (!isFunction[6][i]) setFunc(6, i, i % 2 === 0);
    if (!isFunction[i][6]) setFunc(i, 6, i % 2 === 0);
  }

  // 4. Dark module & reserve format/version areas
  setFunc(n - 8, 8, true);

  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      isFunction[8][i] = true;
      isFunction[i][8] = true;
    }
  }
  for (let i = n - 8; i < n; i++) {
    isFunction[8][i] = true;
    if (i > n - 8) isFunction[i][8] = true;
  }

  if (spec.version >= 7) {
    const vBits = computeVersionInfoBits(spec.version);
    for (let i = 0; i < 18; i++) {
      const dark = ((vBits >> i) & 1) === 1;
      const a = Math.floor(i / 3);
      const b = (i % 3) + n - 11;
      setFunc(a, b, dark);
      setFunc(b, a, dark);
    }
  }

  return { modules, isFunction };
}

function drawFormatInfo(modules: Int8Array[], mask: number) {
  const n = modules.length;
  const bits = computeFormatInfoBits(mask);
  for (let i = 0; i <= 5; i++) modules[8][i] = (bits >> i) & 1;
  modules[8][7] = (bits >> 6) & 1;
  modules[8][8] = (bits >> 7) & 1;
  modules[7][8] = (bits >> 8) & 1;
  for (let i = 9; i < 15; i++) modules[14 - i][8] = (bits >> i) & 1;

  for (let i = 0; i < 8; i++) modules[n - 1 - i][8] = (bits >> i) & 1;
  for (let i = 8; i < 15; i++) modules[8][n - 15 + i] = (bits >> i) & 1;
  modules[n - 8][8] = 1;
}

function penaltyScore(modules: Int8Array[]): number {
  const n = modules.length;
  let score = 0;

  // Rule 1: 5+ consecutive same-color modules
  for (let r = 0; r < n; r++) {
    let runColor = modules[r][0];
    let runLen = 1;
    for (let c = 1; c < n; c++) {
      if (modules[r][c] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) score += 3 + (runLen - 5);
        runColor = modules[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) score += 3 + (runLen - 5);
  }
  for (let c = 0; c < n; c++) {
    let runColor = modules[0][c];
    let runLen = 1;
    for (let r = 1; r < n; r++) {
      if (modules[r][c] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) score += 3 + (runLen - 5);
        runColor = modules[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) score += 3 + (runLen - 5);
  }

  // Rule 2: 2x2 blocks
  for (let r = 0; r < n - 1; r++) {
    for (let c = 0; c < n - 1; c++) {
      const v = modules[r][c];
      if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) {
        score += 3;
      }
    }
  }

  return score;
}

/**
 * Generate a 2D boolean QR matrix for any UTF-8 string (up to ~213 bytes).
 */
export function generateQrMatrix(text: string): boolean[][] {
  const bytes = utf8Bytes(text);

  let chosenSpec = VERSION_SPECS_M[VERSION_SPECS_M.length - 1];
  for (const spec of VERSION_SPECS_M) {
    const headerBits = 4 + (spec.version >= 10 ? 16 : 8);
    const totalNeededBytes = Math.ceil((headerBits + bytes.length * 8) / 8);
    if (totalNeededBytes <= spec.dataCodewords) {
      chosenSpec = spec;
      break;
    }
  }

  const safeBytes = bytes.length > chosenSpec.dataCodewords - 3
    ? bytes.slice(0, chosenSpec.dataCodewords - 3)
    : bytes;

  const codewords = buildCodewords(safeBytes, chosenSpec);
  const n = chosenSpec.size;
  const { modules: baseModules, isFunction } = createBaseMatrix(chosenSpec);

  // Place codeword bits in zigzag scan
  let bitIndex = 0;
  const totalBits = codewords.length * 8;
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < n; vert++) {
      for (let j = 0; j < 2; j++) {
        const col = right - j;
        const upward = ((right + 1) & 2) === 0;
        const row = upward ? n - 1 - vert : vert;
        if (!isFunction[row][col] && bitIndex < totalBits) {
          const byteVal = codewords[bitIndex >> 3];
          const bitVal = (byteVal >> (7 - (bitIndex & 7))) & 1;
          baseModules[row][col] = bitVal;
          bitIndex++;
        }
      }
    }
  }

  // Evaluate masks 0..7
  let bestMask = 0;
  let bestScore = Infinity;
  let bestMatrix: Int8Array[] = baseModules;

  for (let mask = 0; mask < 8; mask++) {
    const candidate = baseModules.map((row) => new Int8Array(row));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!isFunction[r][c] && maskBit(mask, r, c)) {
          candidate[r][c] ^= 1;
        }
      }
    }
    drawFormatInfo(candidate, mask);
    const s = penaltyScore(candidate);
    if (s < bestScore) {
      bestScore = s;
      bestMask = mask;
      bestMatrix = candidate;
    }
  }

  void bestMask;
  return bestMatrix.map((row) => Array.from(row, (v) => v === 1));
}

/**
 * Draw QR Matrix cleanly onto an HTMLCanvasElement.
 */
export function drawQrToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  options?: { sizePx?: number; darkColor?: string; lightColor?: string; quietZone?: number }
): void {
  const matrix = generateQrMatrix(text);
  const quiet = options?.quietZone ?? 3;
  const count = matrix.length + quiet * 2;
  const sizePx = options?.sizePx ?? 220;
  const scale = Math.max(2, Math.floor(sizePx / count));
  const actualPx = count * scale;

  canvas.width = actualPx;
  canvas.height = actualPx;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = options?.lightColor ?? '#FFFFFF';
  ctx.fillRect(0, 0, actualPx, actualPx);

  ctx.fillStyle = options?.darkColor ?? '#1F3327';
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix.length; c++) {
      if (matrix[r][c]) {
        ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
      }
    }
  }
}
