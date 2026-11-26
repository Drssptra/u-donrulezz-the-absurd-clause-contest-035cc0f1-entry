// The Absurd Clause Contest — make.fun entry.
//
// One clause, buried in the fine print: the most recognisable piece of
// terms-of-service boilerplate there is — the arbitration clause —
// resolved not by a court or an arbitrator, but by a duel of
// interpretive dance before three impartial pigeons, whose decision
// is final and binding. The register stays deadpan legal until the
// absurdity hits: "arising under these terms", "shall be resolved",
// "impartial", "final and binding" — every word a real clause would
// use, pointed at a tribunal no real clause would ever convene.
//
// This program writes the clause to entry.txt with no trailing
// newline, after checking it against the competition gate (1-200
// UTF-8 characters, a single line, not only whitespace). Node 22,
// stdlib only, no network, deterministic.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

// The clause, in one piece: a single original English sentence.
const CLAUSE =
  "Any dispute arising under these terms shall be resolved by a duel " +
  "of interpretive dance, judged by three (3) impartial pigeons, " +
  "whose decision shall be final and binding.";

// The gate, as published in the competition kit: 1-200 UTF-8
// characters, not only whitespace.
const GATE = Object.freeze({
  minChars: 1,
  maxChars: 200,
  expectedChars: 170,
});

function countChars(text) {
  return [...text].length;
}

function findGateProblems(text) {
  const problems = [];
  const chars = countChars(text);
  if (chars < GATE.minChars || chars > GATE.maxChars) {
    problems.push(
      `length ${chars} outside ${GATE.minChars}-${GATE.maxChars}`,
    );
  }
  if (chars !== GATE.expectedChars) {
    problems.push(
      `expected ${GATE.expectedChars} characters, got ${chars}`,
    );
  }
  // The clause is plain ASCII, so its UTF-8 byte length must equal
  // its character count; a mismatch means a stray multi-byte
  // character slipped in.
  const bytes = new TextEncoder().encode(text).length;
  if (bytes !== chars) {
    problems.push(`byte length ${bytes} != char length ${chars}`);
  }
  if (text.trim().length === 0) {
    problems.push("entry is only whitespace");
  }
  if (/[\r\n]/.test(text)) {
    problems.push("entry spans more than one line");
  }
  // One sentence: exactly one full stop, at the end.
  if ((text.match(/\./g) ?? []).length !== 1 || !text.endsWith(".")) {
    problems.push("entry is not a single sentence");
  }
  return problems;
}

async function writeEntry(outDir, text) {
  await mkdir(outDir, { recursive: true });
  // No trailing newline: the gate counts every byte in entry.txt.
  const target = join(outDir, "entry.txt");
  await writeFile(target, text, "utf8");
  // Read it back and confirm byte-exactness before reporting success.
  const written = await readFile(target, "utf8");
  if (written !== text) {
    throw new Error("entry.txt does not match the entry text");
  }
}

async function main() {
  const problems = findGateProblems(CLAUSE);
  if (problems.length > 0) {
    throw new Error(`gate failed: ${problems.join("; ")}`);
  }
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  await writeEntry(outDir, CLAUSE);
  // stdout may carry a newline; the file must not.
  process.stdout.write(`${CLAUSE}\n`);
}

main().catch((error) => {
  process.stderr.write(`error: ${error.message}\n`);
  process.exitCode = 1;
});
