/**
 * Unit-тест для computeChainHash — проверка связанности hash-chain.
 *
 * Тестирует:
 *   1. computeDataHash — детерминированность
 *   2. computeChainHash — цепочка из 3 записей, хеши связаны
 *   3. Верификация: изменение одной записи ломает цепочку
 */

// Mock DB and models before requiring auditLogger
jest.mock("../../db", () => ({}));
jest.mock("../../models/index", () => ({ AuditLog: {} }));

const {
  computeDataHash,
  computeChainHash,
  GENESIS_HASH,
} = require("../../modules/core/utils/auditLogger");

describe("auditLogger hash-chain", () => {
  const fixedDate = "2026-02-13T10:00:00.000Z";

  // Три тестовых записи
  const records = [
    {
      userId: 1,
      action: "DOCUMENT_CREATE",
      entity: "Document",
      entityId: "100",
      description: "Created doc",
      metadata: { code: "DOC-001" },
      createdAt: fixedDate,
    },
    {
      userId: 1,
      action: "DOCUMENT_APPROVE",
      entity: "DocumentApproval",
      entityId: "100",
      description: "Approved doc",
      metadata: { decision: "APPROVED" },
      createdAt: "2026-02-13T10:01:00.000Z",
    },
    {
      userId: 2,
      action: "DOCUMENT_MAKE_EFFECTIVE",
      entity: "Document",
      entityId: "100",
      description: "Made effective",
      metadata: {},
      createdAt: "2026-02-13T10:02:00.000Z",
    },
  ];

  test("computeDataHash is deterministic", () => {
    const hash1 = computeDataHash(records[0]);
    const hash2 = computeDataHash(records[0]);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex
  });

  test("computeDataHash differs for different data", () => {
    const hash1 = computeDataHash(records[0]);
    const hash2 = computeDataHash(records[1]);
    expect(hash1).not.toBe(hash2);
  });

  test("chain of 3 records: hashes are linked", () => {
    // Build chain
    const chain = [];
    let prevHash = GENESIS_HASH;

    for (let i = 0; i < records.length; i++) {
      const chainIndex = i + 1;
      const dataHash = computeDataHash(records[i]);
      const currentHash = computeChainHash(chainIndex, prevHash, dataHash);

      chain.push({ chainIndex, dataHash, prevHash, currentHash });
      prevHash = currentHash;
    }

    // Verify linkage: record[n].prevHash === record[n-1].currentHash
    expect(chain[0].prevHash).toBe(GENESIS_HASH);
    expect(chain[1].prevHash).toBe(chain[0].currentHash);
    expect(chain[2].prevHash).toBe(chain[1].currentHash);

    // All hashes are 64-char hex strings
    for (const entry of chain) {
      expect(entry.dataHash).toMatch(/^[a-f0-9]{64}$/);
      expect(entry.currentHash).toMatch(/^[a-f0-9]{64}$/);
    }

    // All currentHashes are unique
    const hashes = chain.map((e) => e.currentHash);
    expect(new Set(hashes).size).toBe(3);
  });

  test("tampered record breaks chain verification", () => {
    // Build valid chain
    const chain = [];
    let prevHash = GENESIS_HASH;

    for (let i = 0; i < records.length; i++) {
      const chainIndex = i + 1;
      const dataHash = computeDataHash(records[i]);
      const currentHash = computeChainHash(chainIndex, prevHash, dataHash);

      chain.push({ chainIndex, dataHash, prevHash, currentHash });
      prevHash = currentHash;
    }

    // Tamper: change record[1] data and recompute its dataHash
    const tamperedData = { ...records[1], description: "TAMPERED" };
    const tamperedDataHash = computeDataHash(tamperedData);
    const recomputedCurrentHash = computeChainHash(2, chain[1].prevHash, tamperedDataHash);

    // The recomputed currentHash differs from original
    expect(recomputedCurrentHash).not.toBe(chain[1].currentHash);

    // Therefore record[2].prevHash no longer matches
    expect(chain[2].prevHash).toBe(chain[1].currentHash);
    expect(chain[2].prevHash).not.toBe(recomputedCurrentHash);
  });

  test("GENESIS_HASH is 64 zeros", () => {
    expect(GENESIS_HASH).toBe("0".repeat(64));
    expect(GENESIS_HASH).toHaveLength(64);
  });
});
