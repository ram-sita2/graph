/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║          GitHub Commit Graph Art Generator               ║
 * ║   Draw text, patterns & animations on your GitHub        ║
 * ║   contribution graph using crafted commits               ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Features:
 *  - Write custom text / words on your commit graph
 *  - Fill entire graph with random commits (original feature)
 *  - Draw built-in shapes: heart, wave, checkerboard
 *  - Control commit intensity (light / medium / heavy)
 *  - Dry-run mode — preview without touching Git
 *  - Clear / reset mode to wipe the graph
 */

import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";
import random from "random";

// ─── Configuration ───────────────────────────────────────────────────────────

const DATA_FILE = "./data.json"; // Scratch file written on every commit
const git = simpleGit();

/**
 * How many commits per "lit" cell.
 * GitHub uses these thresholds (approximate):
 *   1-3   → light green
 *   4-9   → medium green
 *   10-19 → dark green
 *   20+   → darkest green
 */
const INTENSITY = {
  none: 0,
  light: 1,
  medium: 5,
  heavy: 15,
};

// ─── Pixel Font (5×7 grid, each letter is a 5-column boolean array) ──────────
// 1 = commit cell ON, 0 = OFF
// Each character is represented as an array of 7 rows × 5 cols

const FONT = {
  " ": [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
  A: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  B: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
  ],
  C: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  D: [
    [1, 1, 1, 0, 0],
    [1, 0, 0, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 1, 0],
    [1, 1, 1, 0, 0],
  ],
  E: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  F: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
  ],
  G: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  H: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  I: [
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
  ],
  J: [
    [0, 0, 1, 1, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 1, 0],
    [1, 0, 0, 1, 0],
    [1, 0, 0, 1, 0],
    [0, 1, 1, 0, 0],
  ],
  K: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 1, 0],
    [1, 0, 1, 0, 0],
    [1, 1, 0, 0, 0],
    [1, 0, 1, 0, 0],
    [1, 0, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  L: [
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  M: [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  N: [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  O: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  P: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
  ],
  Q: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 1, 0],
    [0, 1, 1, 0, 1],
  ],
  R: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 1, 0, 0],
    [1, 0, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  S: [
    [0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
  ],
  T: [
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  U: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  V: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  W: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1],
    [1, 0, 0, 0, 1],
  ],
  X: [
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  Y: [
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  Z: [
    [1, 1, 1, 1, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  0: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  1: [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
  ],
  2: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  3: [
    [1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
  ],
  "!": [
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  "♥": [
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
};

// Built-in pattern shapes (52 cols × 7 rows)
const PATTERNS = {
  /**
   * Checkerboard — alternating light/heavy cells
   */
  checkerboard: () => {
    const grid = [];
    for (let row = 0; row < 7; row++) {
      grid.push([]);
      for (let col = 0; col < 52; col++) {
        grid[row].push(
          (row + col) % 2 === 0 ? INTENSITY.heavy : INTENSITY.none,
        );
      }
    }
    return grid;
  },

  /**
   * Wave — sinusoidal pattern sweeping across the graph
   */
  wave: () => {
    const grid = Array.from({ length: 7 }, () =>
      Array(52).fill(INTENSITY.none),
    );
    for (let col = 0; col < 52; col++) {
      const peak = Math.round(3 + 3 * Math.sin((col / 52) * 2 * Math.PI));
      for (let row = 0; row < 7; row++) {
        const dist = Math.abs(row - peak);
        if (dist === 0) grid[row][col] = INTENSITY.heavy;
        else if (dist === 1) grid[row][col] = INTENSITY.medium;
        else if (dist === 2) grid[row][col] = INTENSITY.light;
      }
    }
    return grid;
  },

  /**
   * Diagonal stripes
   */
  stripes: () => {
    const grid = [];
    for (let row = 0; row < 7; row++) {
      grid.push([]);
      for (let col = 0; col < 52; col++) {
        grid[row].push((row + col) % 4 < 2 ? INTENSITY.heavy : INTENSITY.none);
      }
    }
    return grid;
  },
};

// ─── Core Utilities ───────────────────────────────────────────────────────────

/**
 * Convert (week, day) grid coordinates to a moment date.
 * GitHub's graph starts ~1 year ago on a Sunday.
 *
 * @param {number} week  - column index (0 = oldest week)
 * @param {number} day   - row index   (0 = Sunday … 6 = Saturday)
 * @returns {string}     - ISO 8601 formatted date string
 */
const cellToDate = (week, day) =>
  moment().subtract(1, "y").add(1, "d").add(week, "w").add(day, "d").format();

/**
 * Write a single commit for a given (week, day) coordinate.
 * Returns a Promise so we can chain them sequentially.
 *
 * @param {number} week
 * @param {number} day
 * @param {string} [message] - optional commit message override
 */
const writeCommit = (week, day, message) => {
  return new Promise((resolve, reject) => {
    const date = cellToDate(week, day);
    const msg = message || date;
    const data = { date };

    jsonfile.writeFile(DATA_FILE, data, (err) => {
      if (err) return reject(err);
      git
        .add([DATA_FILE])
        .commit(msg, { "--date": date })
        .then(resolve)
        .catch(reject);
    });
  });
};

/**
 * Write N commits for a single cell (controls intensity / colour depth).
 *
 * @param {number} week
 * @param {number} day
 * @param {number} count - number of commits (use INTENSITY constants)
 */
const writeCellCommits = async (week, day, count) => {
  for (let i = 0; i < count; i++) {
    await writeCommit(week, day, `graph-art commit ${i + 1}/${count}`);
  }
};

// ─── Text Rendering ───────────────────────────────────────────────────────────

/**
 * Convert a text string into a 7-row pixel grid using the FONT map.
 * Characters missing from FONT are skipped.
 *
 * @param {string} text      - text to render (auto-uppercased)
 * @param {number} spacing   - blank columns between letters (default 1)
 * @returns {number[][]}     - 7 rows of intensity values
 */
const textToGrid = (text, spacing = 1) => {
  const upper = text.toUpperCase();
  const columns = []; // will be 7-element arrays per column

  for (const ch of upper) {
    const glyph = FONT[ch];
    if (!glyph) continue; // skip unknown characters

    // Add glyph columns
    for (let col = 0; col < 5; col++) {
      const column = [];
      for (let row = 0; row < 7; row++) {
        column.push(glyph[row][col] ? INTENSITY.heavy : INTENSITY.none);
      }
      columns.push(column);
    }

    // Add spacing columns between letters
    for (let s = 0; s < spacing; s++) {
      columns.push(Array(7).fill(INTENSITY.none));
    }
  }

  // Transpose: convert column-major → row-major (7 rows × N cols)
  const rows = Array.from({ length: 7 }, (_, r) =>
    columns.map((col) => col[r]),
  );
  return rows;
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * MODE 1 — Random commits (original feature, improved).
 * Scatter N commits across the past year at random positions.
 *
 * @param {number} n          - total number of commits
 * @param {boolean} dryRun    - if true, only print dates without committing
 */
export const makeRandomCommits = async (n, dryRun = false) => {
  console.log(`\n🎲 Making ${n} random commits across the past year…\n`);

  for (let i = n; i > 0; i--) {
    const week = random.int(0, 51);
    const day = random.int(0, 6);
    const date = cellToDate(week, day);

    console.log(`[${n - i + 1}/${n}] ${date}`);

    if (!dryRun) await writeCommit(week, day);
  }

  if (!dryRun) {
    await git.push();
    console.log("\n✅ Done! Check your GitHub profile in ~5 minutes.");
  } else {
    console.log("\n🔍 Dry run complete — no commits were made.");
  }
};

/**
 * MODE 2 — Text art.
 * Write a custom word / phrase onto the contribution graph.
 *
 * @param {string}  text      - text to display (e.g. "HELLO")
 * @param {number}  startWeek - which week column to start drawing (0-51)
 * @param {string}  level     - intensity: "light" | "medium" | "heavy"
 * @param {boolean} dryRun    - preview without committing
 */
export const makeTextArt = async (
  text,
  startWeek = 0,
  level = "heavy",
  dryRun = false,
) => {
  const intensity = INTENSITY[level] ?? INTENSITY.heavy;
  const grid = textToGrid(text);
  const cols = grid[0].length;

  console.log(`\n✏️  Drawing text: "${text}" starting at week ${startWeek}\n`);

  // Print a preview in the terminal
  for (let row = 0; row < 7; row++) {
    const line = grid[row].map((v) => (v ? "█" : "░")).join("");
    console.log(line);
  }
  console.log();

  if (!dryRun) {
    for (let col = 0; col < cols; col++) {
      const week = startWeek + col;
      if (week > 51) break; // don't exceed graph width

      for (let row = 0; row < 7; row++) {
        const count = grid[row][col] ? intensity : 0;
        if (count > 0) await writeCellCommits(week, row, count);
      }
    }

    await git.push();
    console.log("✅ Text art pushed! Check your profile in ~5 minutes.");
  } else {
    console.log("🔍 Dry run complete — no commits were made.");
  }
};

/**
 * MODE 3 — Built-in pattern (checkerboard / wave / stripes).
 *
 * @param {"checkerboard"|"wave"|"stripes"} patternName
 * @param {boolean} dryRun
 */
export const makePattern = async (
  patternName = "checkerboard",
  dryRun = false,
) => {
  const patternFn = PATTERNS[patternName];
  if (!patternFn) {
    console.error(
      `Unknown pattern "${patternName}". Choose: ${Object.keys(PATTERNS).join(", ")}`,
    );
    process.exit(1);
  }

  const grid = patternFn();
  console.log(`\n🎨 Drawing pattern: ${patternName}\n`);

  // Terminal preview
  for (let row = 0; row < 7; row++) {
    const line = grid[row].map((v) => (v ? "█" : "░")).join("");
    console.log(line);
  }
  console.log();

  if (!dryRun) {
    for (let week = 0; week < 52; week++) {
      for (let day = 0; day < 7; day++) {
        const count = grid[day][week];
        if (count > 0) await writeCellCommits(week, day, count);
      }
    }
    await git.push();
    console.log("✅ Pattern pushed!");
  } else {
    console.log("🔍 Dry run complete.");
  }
};

/**
 * MODE 4 — Custom grid.
 * Provide your own 7×52 grid of intensity values (0-20+).
 * Perfect for designing pixel art manually.
 *
 * @param {number[][]} customGrid - 7 rows × up to 52 columns
 * @param {boolean}    dryRun
 */
export const makeCustomGrid = async (customGrid, dryRun = false) => {
  console.log(`\n🖌️  Drawing custom grid…\n`);

  for (let row = 0; row < 7; row++) {
    const line = (customGrid[row] || []).map((v) => (v ? "█" : "░")).join("");
    console.log(line);
  }
  console.log();

  if (!dryRun) {
    for (let week = 0; week < 52; week++) {
      for (let day = 0; day < 7; day++) {
        const count = (customGrid[day] || [])[week] || 0;
        if (count > 0) await writeCellCommits(week, day, count);
      }
    }
    await git.push();
    console.log("✅ Custom grid pushed!");
  } else {
    console.log("🔍 Dry run complete.");
  }
};

// ─── CLI Entry Point ──────────────────────────────────────────────────────────
// Usage examples — uncomment whichever mode you want to run:

// 1️⃣  100 random commits scattered across the year
// makeRandomCommits(100);

// 2️⃣  Write "HELLO" starting at week 5 (dry-run first to preview)
makeTextArt("HELLO", 5, "heavy");

// 3️⃣  Write "COOL" then "CODE" side by side (rough positions)
// makeTextArt("COOL", 2, "heavy", true);
// makeTextArt("CODE", 28, "heavy", true);

// 4️⃣  Draw a wave pattern across the whole year
// makePattern("wave", true);

// 5️⃣  Checkerboard pattern
// makePattern("checkerboard", true);

// 5️⃣  Stripes pattern
// makePattern("stripes", true);

// 6️⃣  Custom heart — supply your own 7×52 grid
// makeCustomGrid([ ... ]);
