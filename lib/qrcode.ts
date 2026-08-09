/**
 * Minimal, dependency-free QR Code encoder (ISO/IEC 18004).
 *
 * Supports byte mode, versions 1-10, all four error-correction levels — enough for
 * URLs and order numbers on printed labels. Returns a boolean matrix (true = dark).
 *
 * This replaces an earlier placeholder that drew finder patterns plus hash-derived
 * noise; that version looked like a QR but could never be scanned.
 */

export type ECLevel = 'L' | 'M' | 'Q' | 'H'

/** Total codewords (data + EC) per version, index = version. */
const TOTAL_CODEWORDS = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346]

/** Alignment pattern centre coordinates per version. */
const ALIGNMENT_POSITIONS: number[][] = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
]

/**
 * Per version and EC level: [ecCodewordsPerBlock, blocksGroup1, dataPerBlockGroup1,
 * blocksGroup2, dataPerBlockGroup2].
 */
const EC_TABLE: Record<ECLevel, number[][]> = {
  L: [
    [],
    [7, 1, 19, 0, 0],
    [10, 1, 34, 0, 0],
    [15, 1, 55, 0, 0],
    [20, 1, 80, 0, 0],
    [26, 1, 108, 0, 0],
    [18, 2, 68, 0, 0],
    [20, 2, 78, 0, 0],
    [24, 2, 97, 0, 0],
    [30, 2, 116, 0, 0],
    [18, 2, 68, 2, 69],
  ],
  M: [
    [],
    [10, 1, 16, 0, 0],
    [16, 1, 28, 0, 0],
    [26, 1, 44, 0, 0],
    [18, 2, 32, 0, 0],
    [24, 2, 43, 0, 0],
    [16, 4, 27, 0, 0],
    [18, 4, 31, 0, 0],
    [22, 2, 38, 2, 39],
    [22, 3, 36, 2, 37],
    [26, 4, 43, 1, 44],
  ],
  Q: [
    [],
    [13, 1, 13, 0, 0],
    [22, 1, 22, 0, 0],
    [18, 2, 17, 0, 0],
    [26, 2, 24, 0, 0],
    [18, 2, 15, 2, 16],
    [24, 4, 19, 0, 0],
    [18, 2, 14, 4, 15],
    [22, 4, 18, 2, 19],
    [20, 4, 16, 4, 17],
    [24, 6, 19, 2, 20],
  ],
  H: [
    [],
    [17, 1, 9, 0, 0],
    [28, 1, 16, 0, 0],
    [22, 2, 13, 0, 0],
    [16, 4, 9, 0, 0],
    [22, 2, 11, 2, 12],
    [28, 4, 15, 0, 0],
    [26, 4, 13, 1, 14],
    [26, 4, 14, 2, 15],
    [24, 4, 12, 4, 13],
    [28, 6, 15, 2, 16],
  ],
}

const EC_FORMAT_BITS: Record<ECLevel, number> = { L: 0b01, M: 0b00, Q: 0b11, H: 0b10 }

/* ---------------------------- GF(256) arithmetic --------------------------- */

const GF_EXP = new Uint8Array(512)
const GF_LOG = new Uint8Array(256)
;(() => {
  let x = 1
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x
    GF_LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d // primitive polynomial
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255]
})()

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return GF_EXP[GF_LOG[a] + GF_LOG[b]]
}

/** Reed-Solomon generator polynomial of the given degree. */
function rsGenerator(degree: number): number[] {
  let poly = [1]
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0)
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j]
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i])
    }
    poly = next
  }
  return poly
}

function rsEncode(data: number[], ecCount: number): number[] {
  const gen = rsGenerator(ecCount)
  const res = new Array(ecCount).fill(0)
  for (const byte of data) {
    const factor = byte ^ res[0]
    res.shift()
    res.push(0)
    for (let i = 0; i < ecCount; i++) res[i] ^= gfMul(gen[i + 1], factor)
  }
  return res
}

/* ------------------------------ BCH format bits ---------------------------- */

function bchRemainder(value: number, generator: number, genBits: number): number {
  let v = value
  const genLen = generator.toString(2).length
  while (v.toString(2).length >= genLen) {
    v ^= generator << (v.toString(2).length - genLen)
  }
  return v & ((1 << genBits) - 1)
}

function formatBits(ec: ECLevel, mask: number): number {
  const data = (EC_FORMAT_BITS[ec] << 3) | mask
  const rem = bchRemainder(data << 10, 0b10100110111, 10)
  return ((data << 10) | rem) ^ 0b101010000010010
}

function versionBits(version: number): number {
  const rem = bchRemainder(version << 12, 0b1111100100101, 12)
  return (version << 12) | rem
}

/* -------------------------------- Encoding --------------------------------- */

function chooseVersion(byteLen: number, ec: ECLevel): number {
  for (let v = 1; v <= 10; v++) {
    const [ecPerBlock, b1, d1, b2, d2] = EC_TABLE[ec][v]
    const dataCodewords = b1 * d1 + b2 * d2
    // 4 mode bits + 8 count bits (versions 1-9) or 16 (version 10) + payload
    const countBits = v <= 9 ? 8 : 16
    const needed = Math.ceil((4 + countBits + byteLen * 8) / 8)
    if (needed <= dataCodewords) return v
    void ecPerBlock
  }
  throw new Error('QR: content too long for version 10')
}

function buildDataCodewords(bytes: number[], version: number, ec: ECLevel): number[] {
  const [, b1, d1, b2, d2] = EC_TABLE[ec][version]
  const totalData = b1 * d1 + b2 * d2
  const countBits = version <= 9 ? 8 : 16

  const bits: number[] = []
  const push = (value: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >> i) & 1)
  }

  push(0b0100, 4) // byte mode
  push(bytes.length, countBits)
  for (const b of bytes) push(b, 8)

  // Terminator, then pad to a byte boundary
  const capacityBits = totalData * 8
  for (let i = 0; i < 4 && bits.length < capacityBits; i++) bits.push(0)
  while (bits.length % 8 !== 0) bits.push(0)

  const codewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j]
    codewords.push(byte)
  }
  // Alternating pad codewords
  const PADS = [0xec, 0x11]
  let padIndex = 0
  while (codewords.length < totalData) codewords.push(PADS[padIndex++ % 2])

  return codewords
}

/** Split into blocks, compute EC, then interleave as the spec requires. */
function interleave(dataCodewords: number[], version: number, ec: ECLevel): number[] {
  const [ecPerBlock, b1, d1, b2, d2] = EC_TABLE[ec][version]
  const blocks: number[][] = []
  const ecBlocks: number[][] = []

  let offset = 0
  for (let i = 0; i < b1; i++) {
    const block = dataCodewords.slice(offset, offset + d1)
    offset += d1
    blocks.push(block)
    ecBlocks.push(rsEncode(block, ecPerBlock))
  }
  for (let i = 0; i < b2; i++) {
    const block = dataCodewords.slice(offset, offset + d2)
    offset += d2
    blocks.push(block)
    ecBlocks.push(rsEncode(block, ecPerBlock))
  }

  const result: number[] = []
  const maxData = Math.max(d1, d2 || 0)
  for (let i = 0; i < maxData; i++) {
    for (const block of blocks) if (i < block.length) result.push(block[i])
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (const block of ecBlocks) result.push(block[i])
  }
  return result
}

/* --------------------------------- Matrix ---------------------------------- */

type Cell = boolean | null

function buildMatrix(version: number, ec: ECLevel, codewords: number[]): boolean[][] {
  const size = version * 4 + 17
  const matrix: Cell[][] = Array.from({ length: size }, () => Array<Cell>(size).fill(null))
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))

  const set = (r: number, c: number, v: boolean) => {
    matrix[r][c] = v
    reserved[r][c] = true
  }

  // Finder patterns + separators
  const placeFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = row + r
        const cc = col + c
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue
        const inRing = (r === 0 || r === 6) && c >= 0 && c <= 6
        const inSide = (c === 0 || c === 6) && r >= 0 && r <= 6
        const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4
        set(rr, cc, inRing || inSide || inCore)
      }
    }
  }
  placeFinder(0, 0)
  placeFinder(0, size - 7)
  placeFinder(size - 7, 0)

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    set(6, i, i % 2 === 0)
    set(i, 6, i % 2 === 0)
  }

  // Alignment patterns
  const positions = ALIGNMENT_POSITIONS[version]
  for (const r of positions) {
    for (const c of positions) {
      // Skip the three corners occupied by finder patterns
      if ((r === 6 && c === 6) || (r === 6 && c === size - 7) || (r === size - 7 && c === 6)) continue
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const isDark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1
          set(r + dr, c + dc, isDark)
        }
      }
    }
  }

  // Dark module
  set(size - 8, 8, true)

  // Reserve format information areas
  for (let i = 0; i < 9; i++) {
    if (!reserved[8][i]) reserved[8][i] = true
    if (!reserved[i][8]) reserved[i][8] = true
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true
    reserved[size - 1 - i][8] = true
  }

  // Reserve version information (versions 7+)
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        reserved[i][size - 11 + j] = true
        reserved[size - 11 + j][i] = true
      }
    }
  }

  // Place data in the two-column zigzag, skipping the vertical timing column
  const bits: number[] = []
  for (const cw of codewords) for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1)

  let bitIndex = 0
  let upward = true
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right = 5 // skip timing column
    for (let step = 0; step < size; step++) {
      const row = upward ? size - 1 - step : step
      for (let c = 0; c < 2; c++) {
        const col = right - c
        if (reserved[row][col]) continue
        matrix[row][col] = bitIndex < bits.length ? bits[bitIndex] === 1 : false
        bitIndex++
      }
    }
    upward = !upward
  }

  // Choose the mask with the lowest penalty
  let bestMask = 0
  let bestPenalty = Infinity
  let bestMatrix: boolean[][] = []
  for (let mask = 0; mask < 8; mask++) {
    const candidate = applyMask(matrix as boolean[][], reserved, mask, size)
    placeFormat(candidate, ec, mask, size)
    if (version >= 7) placeVersion(candidate, version, size)
    const penalty = scorePenalty(candidate, size)
    if (penalty < bestPenalty) {
      bestPenalty = penalty
      bestMask = mask
      bestMatrix = candidate
    }
  }
  void bestMask

  return bestMatrix
}

function maskFn(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0:
      return (r + c) % 2 === 0
    case 1:
      return r % 2 === 0
    case 2:
      return c % 3 === 0
    case 3:
      return (r + c) % 3 === 0
    case 4:
      return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0
    case 5:
      return ((r * c) % 2) + ((r * c) % 3) === 0
    case 6:
      return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0
    default:
      return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
  }
}

function applyMask(matrix: boolean[][], reserved: boolean[][], mask: number, size: number): boolean[][] {
  const out: boolean[][] = Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => !!matrix[r][c]))
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue
      if (maskFn(mask, r, c)) out[r][c] = !out[r][c]
    }
  }
  return out
}

function placeFormat(matrix: boolean[][], ec: ECLevel, mask: number, size: number) {
  const bits = formatBits(ec, mask)
  for (let i = 0; i < 15; i++) {
    // Format bits are placed most-significant first: bit 14 lands at (8,0).
    const bit = ((bits >> (14 - i)) & 1) === 1
    // Copy 1 — around the top-left finder
    if (i < 6) matrix[8][i] = bit
    else if (i === 6) matrix[8][7] = bit
    else if (i === 7) matrix[8][8] = bit
    else if (i === 8) matrix[7][8] = bit
    else matrix[14 - i][8] = bit

    // Copy 2 — split across the other two finders
    if (i < 8) matrix[size - 1 - i][8] = bit
    else matrix[8][size - 15 + i] = bit
  }
  matrix[size - 8][8] = true // dark module
}

function placeVersion(matrix: boolean[][], version: number, size: number) {
  const bits = versionBits(version)
  for (let i = 0; i < 18; i++) {
    const bit = ((bits >> i) & 1) === 1
    const r = Math.floor(i / 3)
    const c = i % 3
    matrix[r][size - 11 + c] = bit
    matrix[size - 11 + c][r] = bit
  }
}

function scorePenalty(m: boolean[][], size: number): number {
  let penalty = 0

  // Rule 1 — runs of five or more same-coloured modules
  for (let i = 0; i < size; i++) {
    for (const horizontal of [true, false]) {
      let run = 1
      for (let j = 1; j < size; j++) {
        const prev = horizontal ? m[i][j - 1] : m[j - 1][i]
        const cur = horizontal ? m[i][j] : m[j][i]
        if (cur === prev) {
          run++
        } else {
          if (run >= 5) penalty += 3 + (run - 5)
          run = 1
        }
      }
      if (run >= 5) penalty += 3 + (run - 5)
    }
  }

  // Rule 2 — 2x2 blocks of the same colour
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = m[r][c]
      if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) penalty += 3
    }
  }

  // Rule 3 — finder-like patterns
  const p1 = [true, false, true, true, true, false, true, false, false, false, false]
  const p2 = [false, false, false, false, true, false, true, true, true, false, true]
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - 11; c++) {
      let m1 = true
      let m2 = true
      for (let k = 0; k < 11; k++) {
        if (m[r][c + k] !== p1[k]) m1 = false
        if (m[r][c + k] !== p2[k]) m2 = false
      }
      if (m1 || m2) penalty += 40
    }
  }
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - 11; r++) {
      let m1 = true
      let m2 = true
      for (let k = 0; k < 11; k++) {
        if (m[r + k][c] !== p1[k]) m1 = false
        if (m[r + k][c] !== p2[k]) m2 = false
      }
      if (m1 || m2) penalty += 40
    }
  }

  // Rule 4 — overall dark/light balance
  let dark = 0
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (m[r][c]) dark++
  const ratio = (dark * 100) / (size * size)
  penalty += Math.floor(Math.abs(ratio - 50) / 5) * 10

  return penalty
}

/** UTF-8 encode — order links and numbers are ASCII, but be safe. */
function toBytes(text: string): number[] {
  const encoded = new TextEncoder().encode(text)
  const out: number[] = []
  for (let i = 0; i < encoded.length; i++) out.push(encoded[i])
  return out
}

/**
 * Encode `text` as a QR matrix. `true` means a dark module.
 * Throws if the content does not fit in version 10 at the requested EC level.
 */
export function encodeQR(text: string, ec: ECLevel = 'M'): boolean[][] {
  const bytes = toBytes(text)
  const version = chooseVersion(bytes.length, ec)
  const data = buildDataCodewords(bytes, version, ec)
  const codewords = interleave(data, version, ec)
  void TOTAL_CODEWORDS
  return buildMatrix(version, ec, codewords)
}
