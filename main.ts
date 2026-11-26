// The Absurd Clause Contest — make.fun entry.
//
// Buried in the fine print of a terms-of-service agreement sits one
// clause that reads like the driest boilerplate ever drafted — until
// you notice what it actually says: any dispute is settled not in
// court, but in a duel of interpretive dance, scored by three
// pigeons who cannot be bribed, swayed, or reasoned with, and whose
// verdict is final. Deadpan legal register, absurd tribunal.
//
// This program assembles that one sentence, checks it against the
// competition gate (1–200 UTF-8 characters, a single line, not only
// whitespace), and writes it to entry.txt with no trailing newline.
// Node 22, standard library only, no network, deterministic.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// The clause, assembled from its four phrases. Joining with a single
// space between phrases yields exactly one sentence.
const PHRASES = [
  "Any dispute arising under these terms",
  "shall be resolved by a duel of interpretive dance,",
  "judged by three (3) impartial pigeons,",
  "whose decision shall be final and binding.",
];

function buildClause() {
  return PHRASES.join(" ");
}

// The gate, as published in the competition kit.
const GATE = {
  minLength: 1,
  maxLength: 200,
  // The clause is 170 characters long; pin it so a stray edit is
  // caught here instead of at grading time.
  expectedLength: 170,
};

// Each rule is a name plus a predicate over the entry text. The gate
// fails when any rule returns a reason string; otherwise it passes.
const RULES = [
  {
    name: "length within gate",
    check(text) {
      const n = Array.from(text).length;
      return n >= GATE.minLength && n <= GATE.maxLength
        ? null
        : `length ${n} is outside ${GATE.minLength}-${GATE.maxLength}`;
    },
  },
  {
    name: "expected length",
    check(text) {
      const n = Array.from(text).length;
      return n === GATE.expectedLength
        ? null
        : `expected ${GATE.expectedLength} characters, got ${n}`;
    },
  },
  {
    name: "plain ASCII",
    check(text) {
      // The clause uses ASCII only, so its UTF-8 byte length must
      // equal its character count; a mismatch means a multi-byte
      // character crept in.
      const bytes = Buffer.byteLength(text, "utf8");
      const chars = Array.from(text).length;
      return bytes === chars
        ? null
        : `byte length ${bytes} != character length ${chars}`;
    },
  },
  {
    name: "not only whitespace",
    check(text) {
      return text.trim().length > 0 ? null : "entry is only whitespace";
    },
  },
  {
    name: "clean joins",
    check(text) {
      // The clause is built by joining phrases with single spaces;
      // a doubled space or stray edge space means a phrase was
      // mistyped, even if the length still fits the gate.
      if (/  /.test(text)) return "entry contains a double space";
      if (text !== text.trim()) return "entry has leading or trailing space";
      return null;
    },
  },
  {
    name: "single line",
    check(text) {
      return /[\r\n]/.test(text) ? "entry spans more than one line" : null;
    },
  },
  {
    name: "one sentence",
    check(text) {
      const stops = (text.match(/\./g) ?? []).length;
      return stops === 1 && text.endsWith(".")
        ? null
        : "entry is not a single sentence ending in a full stop";
    },
  },
];

function runGate(text) {
  const failures = [];
  for (const rule of RULES) {
    const reason = rule.check(text);
    if (reason !== null) failures.push(`${rule.name}: ${reason}`);
  }
  return failures;
}

function writeEntryFile(outDir, text) {
  mkdirSync(outDir, { recursive: true });
  const target = resolve(outDir, "entry.txt");
  // Write the text exactly as given: no trailing newline is added,
  // because the gate counts every byte in entry.txt.
  writeFileSync(target, text, "utf8");
  return target;
}

function verifyWrittenFile(target, text) {
  const raw = readFileSync(target);
  const expected = Buffer.from(text, "utf8");
  if (!raw.equals(expected)) {
    throw new Error("entry.txt bytes do not match the entry text");
  }
  if (raw.length > 0 && raw[raw.length - 1] === 0x0a) {
    throw new Error("entry.txt ends with a newline");
  }
}

function main() {
  const clause = buildClause();
  const failures = runGate(clause);
  if (failures.length > 0) {
    throw new Error(`gate failed: ${failures.join("; ")}`);
  }
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const target = writeEntryFile(outDir, clause);
  verifyWrittenFile(target, clause);
  process.stderr.write(
    `wrote ${Array.from(clause).length} characters ` +
      `(${Buffer.byteLength(clause, "utf8")} bytes) to ${target}\n`,
  );
  // stdout may carry a newline; the file must not.
  process.stdout.write(`${clause}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`error: ${error.message}\n`);
  process.exitCode = 1;
}
