(function (root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.MinimalNotesStore = api;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SCHEMA_VERSION = 4;
  const RECORD_TYPES = ["todo", "meeting", "deadline", "idea", "journal"];
  const REVISION_ENCODING = "full";
  const DEFAULT_SNAPSHOT_POLICY = {
    enabled: false,
    triggerBytes: 280 * 1024,
    warningBytes: 300 * 1024,
    snapshotBytes: 250 * 1024,
    journalEditWindowHours: 72,
    completedAgeDays: 30
  };
  const G_TEACHER_ID_PATTERN = /^g-teacher-\d{4}-\d{2}-\d{2}-(?:morning|evening|pulse-[123])$/;
  const G_TEACHER_SIGNATURE = "——G老师";

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function normalizeIso(value, fallback) {
    if (value !== undefined && value !== null && value !== "") {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    return fallback || "";
  }

  function normalizeRecordType(value, fallback) {
    return RECORD_TYPES.includes(value) ? value : (fallback || "todo");
  }

  function normalizeStringList(value) {
    return Array.from(new Set((Array.isArray(value) ? value : [])
      .filter(function (item) {
        return typeof item === "string" && item;
      })))
      .sort();
  }

  function normalizeNumberList(value, minimum, maximum) {
    return Array.from(new Set((Array.isArray(value) ? value : [])
      .map(function (item) {
        return Number(item);
      })
      .filter(function (item) {
        return Number.isInteger(item) && item >= minimum && item <= maximum;
      })))
      .sort(function (left, right) {
        return left - right;
      });
  }

  function normalizeRecurrence(value) {
    if (!value || typeof value !== "object") {
      return null;
    }
    const frequency = ["daily", "weekly", "monthly", "yearly"].includes(value.frequency)
      ? value.frequency
      : "";
    if (!frequency) {
      return null;
    }
    const intervalValue = Number.parseInt(value.interval, 10);
    const interval = Math.max(1, Math.min(365, Number.isFinite(intervalValue) ? intervalValue : 1));
    const monthDayValue = value.monthDay === "last" ? "last" : Number.parseInt(value.monthDay, 10);
    const monthDay = monthDayValue === "last"
      ? "last"
      : (Number.isInteger(monthDayValue) && monthDayValue >= 1 && monthDayValue <= 31 ? monthDayValue : "");
    const monthValue = Number.parseInt(value.month, 10);
    const month = Number.isInteger(monthValue) && monthValue >= 1 && monthValue <= 12 ? monthValue : 0;
    return {
      frequency: frequency,
      interval: interval,
      mode: value.mode === "sliding" ? "sliding" : "fixed",
      weekdays: normalizeNumberList(value.weekdays, 0, 6),
      monthDay: monthDay,
      month: month,
      label: typeof value.label === "string" ? value.label.slice(0, 24) : ""
    };
  }

  function normalizeRecurrenceCompletion(value) {
    if (!value || typeof value !== "object") {
      return null;
    }
    const completedAt = normalizeIso(value.completedAt);
    if (!completedAt) {
      return null;
    }
    return {
      occurrenceAt: normalizeIso(value.occurrenceAt),
      completedAt: completedAt,
      nextEventAt: normalizeIso(value.nextEventAt),
      text: typeof value.text === "string" ? value.text : "",
      displayText: typeof value.displayText === "string" ? value.displayText : "",
      recurrenceLabel: typeof value.recurrenceLabel === "string" ? value.recurrenceLabel : ""
    };
  }

  function normalizeRecurrenceCompletions(value) {
    const byKey = new Map();
    (Array.isArray(value) ? value : []).forEach(function (item) {
      const normalized = normalizeRecurrenceCompletion(item);
      if (normalized) {
        byKey.set(stableStringify(normalized), normalized);
      }
    });
    return Array.from(byKey.values()).sort(function (left, right) {
      const timeDifference = new Date(left.completedAt).getTime() - new Date(right.completedAt).getTime();
      return timeDifference || stableStringify(left).localeCompare(stableStringify(right));
    });
  }

  function canonicalizeRecord(record) {
    if (!record || typeof record !== "object" || typeof record.id !== "string" || !record.id) {
      throw new Error("A canonical record requires a stable id.");
    }
    const createdAt = normalizeIso(record.createdAt);
    if (!createdAt) {
      throw new Error("A canonical record requires a valid createdAt.");
    }
    const type = normalizeRecordType(record.type);
    const typeLock = RECORD_TYPES.includes(record.typeLock) ? record.typeLock : "";
    return {
      id: record.id,
      text: typeof record.text === "string" ? record.text : "",
      type: type,
      typeLock: typeLock,
      eventAt: normalizeIso(record.eventAt) || null,
      recurrence: normalizeRecurrence(record.recurrence),
      prepared: Boolean(record.prepared),
      completed: Boolean(record.completed),
      ignoredConflictKeys: normalizeStringList(record.ignoredConflictKeys),
      recurrenceCompletions: normalizeRecurrenceCompletions(record.recurrenceCompletions),
      createdAt: createdAt
    };
  }

  function canonicalizeState(value) {
    if (!value || typeof value !== "object") {
      throw new Error("Revision state must be an object.");
    }
    if (value.deleted && !value.record) {
      return { deleted: true, record: null };
    }
    return {
      deleted: Boolean(value.deleted),
      record: canonicalizeRecord(value.record)
    };
  }

  function sortJsonValue(value) {
    if (Array.isArray(value)) {
      return value.map(sortJsonValue);
    }
    if (value && typeof value === "object") {
      const result = {};
      Object.keys(value).sort().forEach(function (key) {
        if (value[key] !== undefined) {
          result[key] = sortJsonValue(value[key]);
        }
      });
      return result;
    }
    return value;
  }

  function stableStringify(value) {
    return JSON.stringify(sortJsonValue(value));
  }

  function utf8Bytes(value) {
    const text = String(value);
    if (typeof TextEncoder !== "undefined") {
      return Array.from(new TextEncoder().encode(text));
    }
    if (typeof Buffer !== "undefined") {
      return Array.from(Buffer.from(text, "utf8"));
    }
    const encoded = encodeURIComponent(text);
    const bytes = [];
    for (let index = 0; index < encoded.length; index += 1) {
      if (encoded[index] === "%") {
        bytes.push(Number.parseInt(encoded.slice(index + 1, index + 3), 16));
        index += 2;
      } else {
        bytes.push(encoded.charCodeAt(index));
      }
    }
    return bytes;
  }

  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  function sha256(value) {
    const bytes = utf8Bytes(value);
    const bitLength = bytes.length * 8;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) {
      bytes.push(0);
    }
    const high = Math.floor(bitLength / 0x100000000);
    const low = bitLength >>> 0;
    for (let shift = 24; shift >= 0; shift -= 8) {
      bytes.push((high >>> shift) & 0xff);
    }
    for (let shift = 24; shift >= 0; shift -= 8) {
      bytes.push((low >>> shift) & 0xff);
    }

    const constants = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    const hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];

    for (let offset = 0; offset < bytes.length; offset += 64) {
      const words = new Array(64);
      for (let index = 0; index < 16; index += 1) {
        const start = offset + index * 4;
        words[index] = ((bytes[start] << 24) | (bytes[start + 1] << 16) | (bytes[start + 2] << 8) | bytes[start + 3]) >>> 0;
      }
      for (let index = 16; index < 64; index += 1) {
        const s0 = rightRotate(words[index - 15], 7) ^ rightRotate(words[index - 15], 18) ^ (words[index - 15] >>> 3);
        const s1 = rightRotate(words[index - 2], 17) ^ rightRotate(words[index - 2], 19) ^ (words[index - 2] >>> 10);
        words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
      }

      let a = hash[0];
      let b = hash[1];
      let c = hash[2];
      let d = hash[3];
      let e = hash[4];
      let f = hash[5];
      let g = hash[6];
      let h = hash[7];
      for (let index = 0; index < 64; index += 1) {
        const sum1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
        const choice = (e & f) ^ ((~e) & g);
        const temporary1 = (h + sum1 + choice + constants[index] + words[index]) >>> 0;
        const sum0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
        const majority = (a & b) ^ (a & c) ^ (b & c);
        const temporary2 = (sum0 + majority) >>> 0;
        h = g;
        g = f;
        f = e;
        e = (d + temporary1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (temporary1 + temporary2) >>> 0;
      }
      hash[0] = (hash[0] + a) >>> 0;
      hash[1] = (hash[1] + b) >>> 0;
      hash[2] = (hash[2] + c) >>> 0;
      hash[3] = (hash[3] + d) >>> 0;
      hash[4] = (hash[4] + e) >>> 0;
      hash[5] = (hash[5] + f) >>> 0;
      hash[6] = (hash[6] + g) >>> 0;
      hash[7] = (hash[7] + h) >>> 0;
    }

    return hash.map(function (word) {
      return word.toString(16).padStart(8, "0");
    }).join("");
  }

  function hashState(state) {
    return sha256(stableStringify(canonicalizeState(state)));
  }

  function normalizeParentRevisionIds(value) {
    return normalizeStringList(value);
  }

  function createRevisionId(input) {
    return "revision-" + sha256(stableStringify(input)).slice(0, 32);
  }

  function createFullRevision(options) {
    const opts = options || {};
    const state = canonicalizeState(opts.state || {
      deleted: Boolean(opts.deleted),
      record: opts.record || null
    });
    const recordId = typeof opts.recordId === "string" && opts.recordId
      ? opts.recordId
      : (state.record && state.record.id);
    if (!recordId) {
      throw new Error("A revision requires a recordId.");
    }
    if (state.record && state.record.id !== recordId) {
      throw new Error("Revision recordId does not match state.record.id.");
    }
    const at = normalizeIso(opts.at);
    if (!at) {
      throw new Error("A revision requires a valid at timestamp.");
    }
    const action = typeof opts.action === "string" && opts.action ? opts.action : "edited";
    const parentRevisionIds = normalizeParentRevisionIds(opts.parentRevisionIds);
    const stateHash = hashState(state);
    const idBasis = {
      recordId: recordId,
      parentRevisionIds: parentRevisionIds,
      action: action,
      at: at,
      stateHash: stateHash
    };
    return {
      id: typeof opts.id === "string" && opts.id ? opts.id : createRevisionId(idBasis),
      recordId: recordId,
      parentRevisionIds: parentRevisionIds,
      action: action,
      at: at,
      encoding: REVISION_ENCODING,
      state: state,
      stateHash: stateHash
    };
  }

  function validateRevision(value) {
    const errors = [];
    if (!value || typeof value !== "object") {
      return { valid: false, errors: ["Revision must be an object."] };
    }
    if (typeof value.id !== "string" || !value.id) {
      errors.push("Revision id is required.");
    }
    if (typeof value.recordId !== "string" || !value.recordId) {
      errors.push("Revision recordId is required.");
    }
    if (value.encoding !== REVISION_ENCODING) {
      errors.push("Revision encoding must be full.");
    }
    if (!normalizeIso(value.at)) {
      errors.push("Revision at timestamp is invalid.");
    }
    let canonicalState = null;
    try {
      canonicalState = canonicalizeState(value.state);
    } catch (error) {
      errors.push(error.message);
    }
    if (canonicalState && canonicalState.record && canonicalState.record.id !== value.recordId) {
      errors.push("Revision recordId does not match state.record.id.");
    }
    if (canonicalState && hashState(canonicalState) !== value.stateHash) {
      errors.push("Revision stateHash does not match canonical state.");
    }
    return { valid: errors.length === 0, errors: errors };
  }

  function dedupeRevisions(value) {
    const byId = new Map();
    (Array.isArray(value) ? value : []).forEach(function (revision) {
      const validation = validateRevision(revision);
      if (!validation.valid) {
        throw new Error("Invalid revision " + String(revision && revision.id || "") + ": " + validation.errors.join(" "));
      }
      const existing = byId.get(revision.id);
      if (existing && stableStringify(existing) !== stableStringify(revision)) {
        throw new Error("Revision id collision: " + revision.id);
      }
      if (!existing) {
        byId.set(revision.id, clone(revision));
      }
    });
    return Array.from(byId.values());
  }

  function latestIso(values, fallback) {
    const valid = (Array.isArray(values) ? values : [])
      .map(function (value) {
        return normalizeIso(value);
      })
      .filter(Boolean)
      .sort();
    return valid.length ? valid[valid.length - 1] : (fallback || "");
  }

  function historyRecordState(record, entry) {
    const at = normalizeIso(entry && entry.at, normalizeIso(record.createdAt));
    const type = normalizeRecordType(entry && entry.type, normalizeRecordType(record.type));
    const currentTypeLock = RECORD_TYPES.includes(record.typeLock) ? record.typeLock : "";
    return canonicalizeRecord({
      id: record.id,
      text: entry && typeof entry.text === "string" ? entry.text : (typeof record.text === "string" ? record.text : ""),
      type: type,
      typeLock: currentTypeLock === type ? currentTypeLock : "",
      eventAt: entry && Object.prototype.hasOwnProperty.call(entry, "eventAt") ? entry.eventAt : record.eventAt,
      recurrence: entry && Object.prototype.hasOwnProperty.call(entry, "recurrence") ? entry.recurrence : record.recurrence,
      prepared: entry && Object.prototype.hasOwnProperty.call(entry, "prepared") ? entry.prepared : record.prepared,
      completed: entry && Object.prototype.hasOwnProperty.call(entry, "completed") ? entry.completed : record.completed,
      ignoredConflictKeys: record.ignoredConflictKeys,
      recurrenceCompletions: normalizeRecurrenceCompletions(record.recurrenceCompletions).filter(function (completion) {
        return !at || new Date(completion.completedAt).getTime() <= new Date(at).getTime();
      }),
      createdAt: record.createdAt
    });
  }

  function normalizeLegacyHistory(record) {
    const entries = (Array.isArray(record && record.history) ? record.history : [])
      .map(function (entry, index) {
        const at = normalizeIso(entry && entry.at);
        if (!entry || typeof entry !== "object" || !at) {
          return null;
        }
        return {
          entry: entry,
          index: index,
          at: at
        };
      })
      .filter(Boolean)
      .sort(function (left, right) {
        const timeDifference = new Date(left.at).getTime() - new Date(right.at).getTime();
        return timeDifference || left.index - right.index;
      });
    if (entries.length) {
      return entries.map(function (item) {
        return item.entry;
      });
    }
    return [{
      action: "created",
      at: normalizeIso(record && record.createdAt, normalizeIso(record && record.updatedAt)),
      text: record && record.text,
      type: record && record.type,
      eventAt: record && record.eventAt,
      recurrence: record && record.recurrence,
      prepared: record && record.prepared,
      completed: record && record.completed
    }];
  }

  function migrateRecordRevisions(record, options) {
    const opts = options || {};
    const canonicalCurrent = canonicalizeRecord(record);
    const history = normalizeLegacyHistory(record);
    const revisions = [];
    let parentRevisionId = "";
    history.forEach(function (entry, index) {
      const action = typeof entry.action === "string" && entry.action ? entry.action : (index === 0 ? "created" : "updated");
      const deleted = action === "deleted";
      const revision = createFullRevision({
        record: historyRecordState(record, entry),
        deleted: deleted,
        action: action,
        at: entry.at,
        parentRevisionIds: parentRevisionId ? [parentRevisionId] : []
      });
      revisions.push(revision);
      parentRevisionId = revision.id;
    });

    const finalDeleted = Boolean(opts.deleted);
    const finalState = canonicalizeState({ deleted: finalDeleted, record: canonicalCurrent });
    const lastRevision = revisions[revisions.length - 1];
    if (!lastRevision || stableStringify(lastRevision.state) !== stableStringify(finalState)) {
      const finalAt = latestIso([
        opts.deletedAt,
        record.updatedAt,
        lastRevision && lastRevision.at,
        record.createdAt
      ], normalizeIso(record.createdAt));
      const revision = createFullRevision({
        record: canonicalCurrent,
        deleted: finalDeleted,
        action: finalDeleted ? "deleted" : "migrated_head",
        at: finalAt,
        parentRevisionIds: parentRevisionId ? [parentRevisionId] : []
      });
      revisions.push(revision);
      parentRevisionId = revision.id;
    }

    return {
      record: Object.assign({}, canonicalCurrent, {
        headRevisionId: parentRevisionId,
        headRevisionAt: revisions.length ? revisions[revisions.length - 1].at : normalizeIso(record.updatedAt, record.createdAt)
      }),
      revisions: revisions,
      headRevisionId: parentRevisionId
    };
  }

  function normalizeTombstone(value) {
    if (!value || typeof value !== "object" || typeof value.recordId !== "string" || !value.recordId) {
      return null;
    }
    const deletedAt = normalizeIso(value.deletedAt);
    if (!deletedAt) {
      return null;
    }
    return {
      recordId: value.recordId,
      deletedAt: deletedAt,
      purged: Boolean(value.purged)
    };
  }

  function migrateV3Payload(payload, options) {
    const source = payload && typeof payload === "object" ? payload : {};
    const opts = options || {};
    const sourceRecords = Array.isArray(source) ? source : (Array.isArray(source.records) ? source.records : []);
    const sourceDeleted = Array.isArray(source) ? [] : (Array.isArray(source.deletedRecords) ? source.deletedRecords : []);
    const savedAt = normalizeIso(source.savedAt, normalizeIso(opts.migratedAt, "1970-01-01T00:00:00.000Z"));
    const syncedAt = normalizeIso(source.syncedAt);
    const records = [];
    const revisions = [];
    const trash = [];
    const tombstoneMap = new Map();

    sourceRecords.forEach(function (record) {
      const migrated = migrateRecordRevisions(record, { deleted: false });
      records.push(migrated.record);
      revisions.push.apply(revisions, migrated.revisions);
    });
    sourceDeleted.forEach(function (entry) {
      const tombstone = normalizeTombstone(entry);
      if (!tombstone) {
        return;
      }
      const existing = tombstoneMap.get(tombstone.recordId);
      if (!existing || new Date(tombstone.deletedAt).getTime() >= new Date(existing.deletedAt).getTime()) {
        tombstoneMap.set(tombstone.recordId, tombstone);
      }
      if (!entry.purged && entry.record) {
        const migrated = migrateRecordRevisions(entry.record, {
          deleted: true,
          deletedAt: entry.deletedAt
        });
        revisions.push.apply(revisions, migrated.revisions);
        trash.push({
          recordId: tombstone.recordId,
          deletedAt: tombstone.deletedAt,
          headRevisionId: migrated.headRevisionId,
          record: migrated.record
        });
      }
    });

    const uniqueRevisions = dedupeRevisions(revisions).sort(function (left, right) {
      return new Date(left.at).getTime() - new Date(right.at).getTime();
    });
    const generationBasis = {
      activeRecordIds: records.map(function (record) { return record.id; }).sort(),
      deletedRecordIds: Array.from(tombstoneMap.keys()).sort(),
      heads: records.concat(trash.map(function (entry) { return entry.record; }))
        .map(function (record) { return [record.id, record.headRevisionId]; })
        .sort(function (left, right) { return left[0].localeCompare(right[0]); })
    };
    return {
      version: SCHEMA_VERSION,
      generation: "generation-" + sha256(stableStringify(generationBasis)).slice(0, 24),
      migratedAt: normalizeIso(opts.migratedAt, savedAt),
      savedAt: savedAt,
      syncedAt: syncedAt,
      records: records,
      tombstones: Array.from(tombstoneMap.values()).sort(function (left, right) {
        return left.recordId.localeCompare(right.recordId);
      }),
      trash: trash.sort(function (left, right) {
        const timeDifference = new Date(left.deletedAt).getTime() - new Date(right.deletedAt).getTime();
        return timeDifference || left.recordId.localeCompare(right.recordId);
      }),
      revisions: uniqueRevisions,
      recurrenceCompletionArchive: clone(source.recurrenceCompletionArchive || []),
      journalStats: clone(source.journalStats || {})
    };
  }

  function jsonText(value) {
    return JSON.stringify(value, null, 2) + "\n";
  }

  function jsonBytes(value) {
    return utf8Bytes(jsonText(value)).length;
  }

  function normalizeSnapshotPolicy(value) {
    const source = value && typeof value === "object" ? value : {};
    function positiveInteger(input, fallback) {
      const number = Number(input);
      return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
    }
    return {
      enabled: source.enabled === true,
      triggerBytes: positiveInteger(source.triggerBytes, DEFAULT_SNAPSHOT_POLICY.triggerBytes),
      warningBytes: positiveInteger(source.warningBytes, DEFAULT_SNAPSHOT_POLICY.warningBytes),
      snapshotBytes: positiveInteger(source.snapshotBytes, DEFAULT_SNAPSHOT_POLICY.snapshotBytes),
      journalEditWindowHours: positiveInteger(
        source.journalEditWindowHours,
        DEFAULT_SNAPSHOT_POLICY.journalEditWindowHours
      ),
      completedAgeDays: positiveInteger(source.completedAgeDays, DEFAULT_SNAPSHOT_POLICY.completedAgeDays)
    };
  }

  function isGTeacherRecord(record) {
    const id = record && typeof record.id === "string" ? record.id : "";
    const text = record && typeof record.text === "string" ? record.text.trim() : "";
    return G_TEACHER_ID_PATTERN.test(id) || text.endsWith(G_TEACHER_SIGNATURE);
  }

  function journalDayKey(record) {
    const createdAt = normalizeIso(record && record.createdAt);
    if (!createdAt) {
      return "";
    }
    const chinaJournalOffsetMs = 3 * 60 * 60 * 1000;
    return new Date(new Date(createdAt).getTime() + chinaJournalOffsetMs).toISOString().slice(0, 10);
  }

  function countTextCharacters(value) {
    return Array.from(String(value || "").replace(/\s+/g, "")).length;
  }

  function emptyCurrentStats() {
    return {
      activeRecords: 0,
      typeCounts: {
        todo: 0,
        meeting: 0,
        deadline: 0,
        idea: 0,
        journal: 0
      },
      completedRecords: 0,
      userJournals: 0,
      gTeacherJournals: 0,
      userJournalCharacters: 0,
      userJournalByDate: {}
    };
  }

  function normalizeCurrentStats(value) {
    const source = value && typeof value === "object" ? value : {};
    const result = emptyCurrentStats();
    function count(input) {
      const number = Number(input);
      return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
    }
    result.activeRecords = count(source.activeRecords);
    RECORD_TYPES.forEach(function (type) {
      result.typeCounts[type] = count(source.typeCounts && source.typeCounts[type]);
    });
    result.completedRecords = count(source.completedRecords);
    result.userJournals = count(source.userJournals);
    result.gTeacherJournals = count(source.gTeacherJournals);
    result.userJournalCharacters = count(source.userJournalCharacters);
    Object.keys(source.userJournalByDate || {}).sort().forEach(function (day) {
      const dayCount = count(source.userJournalByDate[day]);
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && dayCount) {
        result.userJournalByDate[day] = dayCount;
      }
    });
    return result;
  }

  function adjustCurrentStats(stats, record, amount) {
    if (!record || !amount) {
      return stats;
    }
    const canonical = canonicalizeRecord(record);
    stats.activeRecords = Math.max(0, stats.activeRecords + amount);
    stats.typeCounts[canonical.type] = Math.max(0, (stats.typeCounts[canonical.type] || 0) + amount);
    if (canonical.completed) {
      stats.completedRecords = Math.max(0, stats.completedRecords + amount);
    }
    if (canonical.type !== "journal") {
      return stats;
    }
    if (isGTeacherRecord(canonical)) {
      stats.gTeacherJournals = Math.max(0, stats.gTeacherJournals + amount);
      return stats;
    }
    stats.userJournals = Math.max(0, stats.userJournals + amount);
    stats.userJournalCharacters = Math.max(
      0,
      stats.userJournalCharacters + amount * countTextCharacters(canonical.text)
    );
    const day = journalDayKey(canonical);
    if (day) {
      const nextDayCount = Math.max(0, (stats.userJournalByDate[day] || 0) + amount);
      if (nextDayCount) {
        stats.userJournalByDate[day] = nextDayCount;
      } else {
        delete stats.userJournalByDate[day];
      }
    }
    return stats;
  }

  function computeCurrentStats(records) {
    const stats = emptyCurrentStats();
    (Array.isArray(records) ? records : []).forEach(function (record) {
      try {
        adjustCurrentStats(stats, record, 1);
      } catch (error) {
        // Invalid records are rejected elsewhere; stats only cover canonical records.
      }
    });
    return normalizeCurrentStats(stats);
  }

  function updateCurrentStats(value, changes) {
    const stats = normalizeCurrentStats(value);
    (Array.isArray(changes) ? changes : []).forEach(function (change) {
      if (change && change.before) {
        adjustCurrentStats(stats, change.before, -1);
      }
      if (change && change.after) {
        adjustCurrentStats(stats, change.after, 1);
      }
    });
    return normalizeCurrentStats(stats);
  }

  function snapshotSortAt(record) {
    return normalizeIso(record && record.headRevisionAt, normalizeIso(record && record.createdAt));
  }

  function buildSnapshotEnvelope(generation, records) {
    return {
      version: SCHEMA_VERSION,
      generation: generation,
      kind: "snapshots",
      open: false,
      records: clone(Array.isArray(records) ? records : [])
    };
  }

  function buildSnapshotDescriptor(pathValue, envelope, maxBytes) {
    if (!envelope || envelope.kind !== "snapshots" || !Array.isArray(envelope.records)) {
      throw new Error("A snapshot descriptor requires a snapshot envelope.");
    }
    const dates = envelope.records.map(snapshotSortAt).filter(Boolean).sort();
    const typeCounts = {};
    RECORD_TYPES.forEach(function (type) { typeCounts[type] = 0; });
    let completedCount = 0;
    envelope.records.forEach(function (record) {
      const type = normalizeRecordType(record && record.type);
      typeCounts[type] += 1;
      if (record && record.completed) {
        completedCount += 1;
      }
    });
    const text = jsonText(envelope);
    const bytes = utf8Bytes(text).length;
    return {
      path: pathValue,
      open: false,
      bytes: bytes,
      contentHash: sha256(text),
      mutable: false,
      firstSortAt: dates[0] || "",
      lastSortAt: dates[dates.length - 1] || "",
      itemCount: envelope.records.length,
      typeCounts: typeCounts,
      completedCount: completedCount,
      oversize: bytes > (Number(maxBytes) || DEFAULT_SNAPSHOT_POLICY.snapshotBytes)
    };
  }

  function getSnapshotEligibility(record, options) {
    const opts = options || {};
    const policy = normalizeSnapshotPolicy(opts.snapshotPolicy);
    const now = normalizeIso(opts.now, new Date().toISOString());
    const nowMs = new Date(now).getTime();
    let canonical = null;
    try {
      canonical = canonicalizeRecord(record);
    } catch (error) {
      return { eligible: false, reason: "invalid", sortAt: "" };
    }
    if (canonical.type === "journal") {
      const createdAt = normalizeIso(canonical.createdAt);
      const cutoffMs = nowMs - policy.journalEditWindowHours * 60 * 60 * 1000;
      return {
        eligible: Boolean(createdAt) && new Date(createdAt).getTime() <= cutoffMs,
        reason: "journal-edit-window",
        sortAt: snapshotSortAt(record)
      };
    }
    const completedTypes = ["todo", "meeting", "deadline"];
    if (!completedTypes.includes(canonical.type) || !canonical.completed || canonical.recurrence) {
      return { eligible: false, reason: "active", sortAt: snapshotSortAt(record) };
    }
    const headRevisionAt = normalizeIso(record && record.headRevisionAt, canonical.createdAt);
    const completedCutoffMs = nowMs - policy.completedAgeDays * 24 * 60 * 60 * 1000;
    return {
      eligible: Boolean(headRevisionAt) && new Date(headRevisionAt).getTime() <= completedCutoffMs,
      reason: "completed-age",
      sortAt: snapshotSortAt(record)
    };
  }

  function nextSnapshotSequence(manifest, month) {
    const pattern = new RegExp("/snapshots/" + month.replace("-", "\\-") + "-(\\d{3})\\.json$");
    return (manifest.snapshots || []).reduce(function (current, descriptor) {
      const match = String(descriptor.path || "").match(pattern);
      return match ? Math.max(current, Number.parseInt(match[1], 10)) : current;
    }, 0) + 1;
  }

  function archiveEligibleHotRecords(layout, options) {
    const opts = options || {};
    const next = layoutFromFiles(layout.manifestPath, layout.manifest, layout.files);
    const manifest = next.manifest;
    const hot = next.hot;
    manifest.snapshots = Array.isArray(manifest.snapshots) ? manifest.snapshots : [];
    manifest.recordIndex = manifest.recordIndex && typeof manifest.recordIndex === "object"
      ? manifest.recordIndex
      : {};
    const now = normalizeIso(opts.now, new Date().toISOString());
    const previousPolicy = normalizeSnapshotPolicy(manifest.snapshotPolicy);
    const policy = normalizeSnapshotPolicy(Object.assign(
      {},
      previousPolicy,
      opts.snapshotPolicy && typeof opts.snapshotPolicy === "object" ? opts.snapshotPolicy : {}
    ));
    const beforeHotText = jsonText(hot);
    const beforeHotBytes = utf8Bytes(beforeHotText).length;
    const shouldArchive = opts.force === true
      || (policy.enabled && beforeHotBytes > policy.triggerBytes);
    const completeBefore = hasCompleteSnapshotFiles(next);
    const activeBefore = completeBefore
      ? collectLayoutSnapshots(next).concat(hot.records || [])
      : [];
    const candidates = [];
    if (shouldArchive) {
      (hot.records || []).forEach(function (record) {
        const eligibility = getSnapshotEligibility(record, {
          now: now,
          snapshotPolicy: policy
        });
        if (eligibility.eligible) {
          candidates.push({
            record: record,
            reason: eligibility.reason,
            sortAt: eligibility.sortAt
          });
        }
      });
    }
    candidates.sort(function (left, right) {
      return String(left.sortAt || "").localeCompare(String(right.sortAt || ""))
        || left.record.id.localeCompare(right.record.id);
    });

    const groups = [];
    const sequences = {};
    let current = null;
    function startGroup(month) {
      sequences[month] = sequences[month] || nextSnapshotSequence(manifest, month);
      current = {
        month: month,
        sequence: sequences[month],
        records: []
      };
      sequences[month] += 1;
      groups.push(current);
    }
    candidates.forEach(function (candidate) {
      const month = shardMonth(candidate.sortAt, now.slice(0, 7));
      if (!current || current.month !== month) {
        startGroup(month);
      }
      const envelope = buildSnapshotEnvelope(
        manifest.generation,
        current.records.concat([candidate.record])
      );
      if (current.records.length && jsonBytes(envelope) > policy.snapshotBytes) {
        startGroup(month);
      }
      current.records.push(candidate.record);
    });

    const snapshotPaths = [];
    const candidateIds = new Set(candidates.map(function (item) { return item.record.id; }));
    groups.forEach(function (group) {
      const pathValue = next.basePath + "/snapshots/" + group.month + "-"
        + String(group.sequence).padStart(3, "0") + ".json";
      const envelope = buildSnapshotEnvelope(manifest.generation, group.records);
      const descriptor = buildSnapshotDescriptor(pathValue, envelope, policy.snapshotBytes);
      next.files[pathValue] = envelope;
      manifest.snapshots.push(descriptor);
      snapshotPaths.push(pathValue);
      group.records.forEach(function (record) {
        const indexEntry = manifest.recordIndex[record.id] || { revisionShards: [] };
        indexEntry.location = pathValue;
        indexEntry.headRevisionId = typeof record.headRevisionId === "string" ? record.headRevisionId : "";
        indexEntry.headRevisionAt = normalizeIso(record.headRevisionAt, record.createdAt);
        indexEntry.revisionShards = Array.isArray(indexEntry.revisionShards)
          ? indexEntry.revisionShards
          : [];
        manifest.recordIndex[record.id] = indexEntry;
      });
    });
    manifest.snapshots.sort(function (left, right) {
      return String(left.firstSortAt || "").localeCompare(String(right.firstSortAt || ""))
        || left.path.localeCompare(right.path);
    });
    if (candidateIds.size) {
      hot.records = (hot.records || []).filter(function (record) {
        return !candidateIds.has(record.id);
      });
    }
    manifest.snapshotPolicy = policy;
    if (completeBefore) {
      manifest.currentStats = computeCurrentStats(activeBefore);
    } else if (manifest.currentStats) {
      manifest.currentStats = normalizeCurrentStats(manifest.currentStats);
    }
    const afterHotText = jsonText(hot);
    const afterHotBytes = utf8Bytes(afterHotText).length;
    manifest.hot = {
      path: manifest.hot.path,
      bytes: afterHotBytes,
      contentHash: sha256(afterHotText),
      mutable: true,
      oversize: afterHotBytes > policy.warningBytes
    };
    const policyChanged = stableStringify(previousPolicy) !== stableStringify(policy);
    const changed = Boolean(candidateIds.size || policyChanged);
    if (changed) {
      manifest.updatedAt = now;
    }
    next.files[manifest.hot.path] = hot;
    next.files[next.manifestPath] = manifest;
    next.hot = hot;
    return {
      layout: next,
      changed: changed,
      candidates: candidates.map(function (item) {
        return {
          id: item.record.id,
          type: item.record.type,
          reason: item.reason,
          sortAt: item.sortAt,
          headRevisionId: item.record.headRevisionId || "",
          headRevisionAt: normalizeIso(item.record.headRevisionAt, item.record.createdAt)
        };
      }),
      snapshotPaths: snapshotPaths,
      snapshotDescriptors: snapshotPaths.map(function (pathValue) {
        return manifest.snapshots.find(function (descriptor) {
          return descriptor.path === pathValue;
        });
      }),
      beforeHotBytes: beforeHotBytes,
      afterHotBytes: afterHotBytes,
      writes: snapshotPaths.map(function (pathValue) {
        return { role: "snapshot", path: pathValue, value: next.files[pathValue] };
      }).concat(changed ? [
        { role: "manifest", path: next.manifestPath, value: manifest },
        { role: "hot", path: manifest.hot.path, value: hot }
      ] : [])
    };
  }

  function shardMonth(value, fallback) {
    const at = normalizeIso(value);
    return at ? at.slice(0, 7) : fallback;
  }

  function buildShardEnvelope(kind, generation, open, items) {
    const envelope = {
      version: SCHEMA_VERSION,
      generation: generation,
      kind: kind,
      open: Boolean(open)
    };
    envelope[kind === "revisions" ? "revisions" : "entries"] = items;
    return envelope;
  }

  function packShards(items, options) {
    const opts = options || {};
    const kind = opts.kind;
    const generation = opts.generation;
    const basePath = opts.basePath;
    const maxBytes = opts.maxBytes;
    const currentMonth = opts.currentMonth;
    const groups = [];
    let current = null;
    const sequences = {};

    function start(month) {
      sequences[month] = (sequences[month] || 0) + 1;
      current = {
        month: month,
        sequence: sequences[month],
        items: []
      };
      groups.push(current);
    }

    (Array.isArray(items) ? items : []).forEach(function (item) {
      const dateValue = kind === "revisions" ? item.at : item.deletedAt;
      const month = shardMonth(dateValue, currentMonth);
      if (!current || current.month !== month) {
        start(month);
      }
      const candidate = buildShardEnvelope(kind, generation, false, current.items.concat([item]));
      if (current.items.length && jsonBytes(candidate) > maxBytes) {
        start(month);
      }
      current.items.push(item);
    });
    if (!groups.length) {
      start(currentMonth);
    }

    return groups.map(function (group, index) {
      const open = index === groups.length - 1;
      const envelope = buildShardEnvelope(kind, generation, open, group.items);
      const path = basePath + "/" + kind + "/" + group.month + "-" + String(group.sequence).padStart(3, "0") + ".json";
      const bytes = jsonBytes(envelope);
      return {
        path: path,
        month: group.month,
        open: open,
        bytes: bytes,
        oversize: bytes > maxBytes,
        contentHash: sha256(jsonText(envelope)),
        envelope: envelope
      };
    });
  }

  function buildV4Layout(model, options) {
    const source = model && typeof model === "object" ? model : {};
    const opts = options || {};
    const basePath = String(opts.basePath || "minimal-notes-sync").replace(/^\/+|\/+$/g, "");
    const hotMaxBytes = Number(opts.hotMaxBytes) || 300 * 1024;
    const shardMaxBytes = Number(opts.shardMaxBytes) || 250 * 1024;
    const snapshotPolicy = normalizeSnapshotPolicy(opts.snapshotPolicy);
    const currentMonth = (normalizeIso(opts.now, normalizeIso(source.migratedAt, source.savedAt)) || "1970-01").slice(0, 7);
    const generation = source.generation;
    const hotPath = basePath + "/hot.json";
    const manifestPath = basePath + "/manifest.json";
    const hot = {
      version: SCHEMA_VERSION,
      generation: generation,
      savedAt: source.savedAt,
      syncedAt: source.syncedAt || "",
      records: clone(source.records || []),
      tombstones: clone(source.tombstones || []),
      recurrenceCompletionArchive: clone(source.recurrenceCompletionArchive || []),
      journalStats: clone(source.journalStats || {})
    };
    const revisionShards = packShards(source.revisions, {
      kind: "revisions",
      generation: generation,
      basePath: basePath,
      maxBytes: shardMaxBytes,
      currentMonth: currentMonth
    });
    const trashShards = packShards(source.trash, {
      kind: "trash",
      generation: generation,
      basePath: basePath,
      maxBytes: shardMaxBytes,
      currentMonth: currentMonth
    });
    const recordIndex = {};
    (source.records || []).forEach(function (record) {
      recordIndex[record.id] = {
        location: hotPath,
        headRevisionId: typeof record.headRevisionId === "string" ? record.headRevisionId : "",
        headRevisionAt: normalizeIso(record.headRevisionAt, record.createdAt),
        revisionShards: []
      };
    });
    (source.trash || []).forEach(function (entry) {
      recordIndex[entry.recordId] = {
        location: "",
        headRevisionId: typeof entry.headRevisionId === "string" ? entry.headRevisionId : "",
        headRevisionAt: normalizeIso(entry.deletedAt),
        revisionShards: []
      };
    });
    (source.tombstones || []).forEach(function (entry) {
      if (!recordIndex[entry.recordId]) {
        recordIndex[entry.recordId] = { location: "", revisionShards: [] };
      }
    });
    revisionShards.forEach(function (shard) {
      shard.envelope.revisions.forEach(function (revision) {
        if (!recordIndex[revision.recordId]) {
          recordIndex[revision.recordId] = { location: "", revisionShards: [] };
        }
        if (!recordIndex[revision.recordId].revisionShards.includes(shard.path)) {
          recordIndex[revision.recordId].revisionShards.push(shard.path);
        }
      });
    });
    trashShards.forEach(function (shard) {
      shard.envelope.entries.forEach(function (entry) {
        if (!recordIndex[entry.recordId]) {
          recordIndex[entry.recordId] = { location: "", revisionShards: [] };
        }
        recordIndex[entry.recordId].location = shard.path;
      });
    });

    function descriptor(shard) {
      const items = shard.envelope[shard.envelope.kind === "revisions" ? "revisions" : "entries"];
      const dates = items.map(function (item) {
        return normalizeIso(shard.envelope.kind === "revisions" ? item.at : item.deletedAt);
      }).filter(Boolean).sort();
      return {
        path: shard.path,
        open: shard.open,
        bytes: shard.bytes,
        contentHash: shard.contentHash,
        mutable: shard.open,
        firstAt: dates[0] || "",
        lastAt: dates[dates.length - 1] || "",
        itemCount: items.length,
        oversize: shard.oversize
      };
    }

    const hotText = jsonText(hot);
    const manifest = {
      version: SCHEMA_VERSION,
      generation: generation,
      createdAt: source.migratedAt || source.savedAt,
      updatedAt: source.savedAt,
      limits: { hotBytes: hotMaxBytes, shardBytes: shardMaxBytes },
      snapshotPolicy: snapshotPolicy,
      hot: {
        path: hotPath,
        bytes: utf8Bytes(hotText).length,
        contentHash: sha256(hotText),
        mutable: true,
        oversize: utf8Bytes(hotText).length > hotMaxBytes
      },
      openRevisionShard: revisionShards[revisionShards.length - 1].path,
      openTrashShard: trashShards[trashShards.length - 1].path,
      snapshots: [],
      revisions: revisionShards.map(descriptor),
      trash: trashShards.map(descriptor),
      currentStats: computeCurrentStats(source.records || []),
      recordIndex: recordIndex
    };
    const files = {};
    files[manifestPath] = manifest;
    files[hotPath] = hot;
    revisionShards.forEach(function (shard) { files[shard.path] = shard.envelope; });
    trashShards.forEach(function (shard) { files[shard.path] = shard.envelope; });
    return {
      version: SCHEMA_VERSION,
      basePath: basePath,
      manifestPath: manifestPath,
      manifest: manifest,
      hot: hot,
      files: files
    };
  }

  function collectLayoutRevisions(layout) {
    const revisions = [];
    Object.keys(layout && layout.files || {}).forEach(function (path) {
      const file = layout.files[path];
      if (file && file.kind === "revisions" && Array.isArray(file.revisions)) {
        revisions.push.apply(revisions, file.revisions);
      }
    });
    return dedupeRevisions(revisions);
  }

  function collectLayoutTrash(layout) {
    const entries = [];
    Object.keys(layout && layout.files || {}).forEach(function (path) {
      const file = layout.files[path];
      if (file && file.kind === "trash" && Array.isArray(file.entries)) {
        entries.push.apply(entries, clone(file.entries));
      }
    });
    return entries;
  }

  function collectLayoutSnapshots(layout) {
    const records = [];
    const recordIndex = layout && layout.manifest && layout.manifest.recordIndex || {};
    Object.keys(layout && layout.files || {}).forEach(function (path) {
      const file = layout.files[path];
      if (file && file.kind === "snapshots" && Array.isArray(file.records)) {
        file.records.forEach(function (record) {
          const indexEntry = record && recordIndex[record.id];
          if (indexEntry && indexEntry.location === path) {
            records.push(clone(record));
          }
        });
      }
    });
    return records;
  }

  function hasCompleteSnapshotFiles(layout) {
    return (layout && layout.manifest && layout.manifest.snapshots || []).every(function (descriptor) {
      const file = layout && layout.files && layout.files[descriptor.path];
      return file && file.kind === "snapshots" && Array.isArray(file.records);
    });
  }

  function validateV4Layout(layout) {
    const errors = [];
    if (!layout || !layout.manifest || !layout.hot) {
      return { valid: false, errors: ["Layout requires manifest and hot files."] };
    }
    if (layout.manifest.version !== SCHEMA_VERSION || layout.hot.version !== SCHEMA_VERSION) {
      errors.push("Manifest and hot schema versions must be 4.");
    }
    if (layout.manifest.generation !== layout.hot.generation) {
      errors.push("Manifest and hot generation differ.");
    }
    const revisions = collectLayoutRevisions(layout);
    const revisionsById = new Map(revisions.map(function (revision) { return [revision.id, revision]; }));
    const activeRecords = collectLayoutSnapshots(layout).concat(layout.hot.records || []);
    activeRecords.forEach(function (record) {
      const head = revisionsById.get(record.headRevisionId);
      if (!head) {
        errors.push("Active head revision is missing for " + record.id + ".");
        return;
      }
      if (head.state.deleted) {
        errors.push("Active head revision is deleted for " + record.id + ".");
      }
      const activeCanonical = canonicalizeRecord(record);
      if (stableStringify(activeCanonical) !== stableStringify(head.state.record)) {
        errors.push("Active state differs from head revision for " + record.id + ".");
      }
    });
    if (hasCompleteSnapshotFiles(layout)) {
      const activeIds = new Set(activeRecords.map(function (record) { return record.id; }));
      const activeLocations = new Set([layout.manifest.hot.path].concat(
        (layout.manifest.snapshots || []).map(function (descriptor) { return descriptor.path; })
      ));
      Object.keys(layout.manifest.recordIndex || {}).forEach(function (recordId) {
        const indexEntry = layout.manifest.recordIndex[recordId];
        if (indexEntry && activeLocations.has(indexEntry.location) && !activeIds.has(recordId)) {
          errors.push("Record index points to a missing active state for " + recordId + ".");
        }
      });
    }
    activeRecords.forEach(function (record) {
      const indexEntry = layout.manifest.recordIndex && layout.manifest.recordIndex[record.id];
      const expectedLocation = (layout.hot.records || []).some(function (item) { return item.id === record.id; })
        ? layout.manifest.hot.path
        : indexEntry && indexEntry.location;
      if (!indexEntry || indexEntry.location !== expectedLocation) {
        errors.push("Active record index location is missing for " + record.id + ".");
      }
      if (indexEntry && indexEntry.headRevisionId && indexEntry.headRevisionId !== record.headRevisionId) {
        errors.push("Active record index head differs for " + record.id + ".");
      }
    });
    const tombstoneIds = new Set((layout.hot.tombstones || []).map(function (item) { return item.recordId; }));
    (layout.hot.records || []).forEach(function (record) {
      if (tombstoneIds.has(record.id)) {
        errors.push("A hot record is also tombstoned: " + record.id + ".");
      }
    });
    Object.keys(layout.files || {}).forEach(function (path) {
      const file = layout.files[path];
      if (!file || path === layout.manifestPath) {
        return;
      }
      const expected = path === layout.manifest.hot.path
        ? layout.manifest.hot
        : (layout.manifest.snapshots || []).concat(layout.manifest.revisions || [], layout.manifest.trash || []).find(function (item) { return item.path === path; });
      if (!expected) {
        errors.push("Manifest does not describe " + path + ".");
        return;
      }
      const text = jsonText(file);
      if (expected.bytes !== utf8Bytes(text).length || expected.contentHash !== sha256(text)) {
        errors.push("Manifest bytes or hash differ for " + path + ".");
      }
      const limit = path === layout.manifest.hot.path
        ? layout.manifest.limits.hotBytes
        : layout.manifest.limits.shardBytes;
      if (utf8Bytes(text).length > limit && !expected.oversize) {
        errors.push("Unmarked oversize file: " + path + ".");
      }
      if (file.kind === "snapshots" && Array.isArray(file.records)) {
        if (file.open || file.generation !== layout.manifest.generation || expected.mutable) {
          errors.push("Snapshot envelope must be immutable and match the manifest generation: " + path + ".");
        }
      }
    });
    if (layout.manifest.currentStats && hasCompleteSnapshotFiles(layout)) {
      const expectedStats = computeCurrentStats(activeRecords);
      if (stableStringify(normalizeCurrentStats(layout.manifest.currentStats)) !== stableStringify(expectedStats)) {
        errors.push("Manifest currentStats differ from canonical active records.");
      }
    }
    return {
      valid: errors.length === 0,
      errors: errors,
      revisionCount: revisions.length,
      recordCount: activeRecords.length,
      trashCount: collectLayoutTrash(layout).length
    };
  }

  function historyEntryFromRevision(revision) {
    if (!revision || !revision.state || !revision.state.record) {
      return null;
    }
    const record = revision.state.record;
    return {
      action: revision.action,
      at: revision.at,
      text: record.text,
      type: record.type,
      eventAt: record.eventAt || "",
      recurrence: clone(record.recurrence),
      prepared: Boolean(record.prepared),
      completed: Boolean(record.completed)
    };
  }

  function legacyRecordFromCanonical(record, revisions) {
    const canonical = canonicalizeRecord(record);
    const history = (Array.isArray(revisions) ? revisions : [])
      .filter(function (revision) {
        return revision.recordId === canonical.id && revision.action !== "migrated_head";
      })
      .sort(function (left, right) {
        const timeDifference = new Date(left.at).getTime() - new Date(right.at).getTime();
        return timeDifference || left.id.localeCompare(right.id);
      })
      .map(historyEntryFromRevision)
      .filter(Boolean);
    const result = {
      id: canonical.id,
      text: canonical.text,
      type: canonical.type,
      createdAt: canonical.createdAt,
      eventAt: canonical.eventAt || "",
      recurrence: clone(canonical.recurrence),
      ignoredConflictKeys: clone(canonical.ignoredConflictKeys),
      history: history,
      recurrenceCompletions: clone(canonical.recurrenceCompletions),
      prepared: canonical.prepared,
      completed: canonical.completed,
      updatedAt: normalizeIso(record.updatedAt, (revisions || []).find(function (revision) {
        return revision.id === record.headRevisionId;
      })?.at || canonical.createdAt)
    };
    if (canonical.typeLock) {
      result.typeLock = canonical.typeLock;
    }
    return result;
  }

  function exportV3Snapshot(layout) {
    const revisions = collectLayoutRevisions(layout);
    const activeById = new Map();
    collectLayoutSnapshots(layout).forEach(function (record) {
      activeById.set(record.id, record);
    });
    (layout.hot.records || []).forEach(function (record) {
      activeById.set(record.id, record);
    });
    (layout.hot.tombstones || []).forEach(function (tombstone) {
      activeById.delete(tombstone.recordId);
    });
    const active = Array.from(activeById.values()).map(function (record) {
      return legacyRecordFromCanonical(record, revisions);
    });
    const deletedRecords = collectLayoutTrash(layout).map(function (entry) {
      return {
        recordId: entry.recordId,
        deletedAt: entry.deletedAt,
        record: legacyRecordFromCanonical(entry.record, revisions)
      };
    });
    (layout.hot.tombstones || []).filter(function (tombstone) {
      return tombstone.purged;
    }).forEach(function (tombstone) {
      deletedRecords.push({
        recordId: tombstone.recordId,
        deletedAt: tombstone.deletedAt,
        purged: true
      });
    });
    const result = {
      version: 3,
      savedAt: layout.hot.savedAt,
      records: active,
      deletedRecords: deletedRecords.sort(function (left, right) {
        return new Date(left.deletedAt).getTime() - new Date(right.deletedAt).getTime();
      }),
      recurrenceCompletionArchive: clone(layout.hot.recurrenceCompletionArchive || [])
    };
    if (layout.hot.syncedAt) {
      result.syncedAt = layout.hot.syncedAt;
    }
    if (layout.hot.journalStats && Object.keys(layout.hot.journalStats).length) {
      result.journalStats = clone(layout.hot.journalStats);
    }
    return result;
  }

  function payloadFromV4Hot(hot) {
    const source = hot && typeof hot === "object" ? hot : {};
    const records = (Array.isArray(source.records) ? source.records : []).map(function (record) {
      const legacy = legacyRecordFromCanonical(record, []);
      legacy.headRevisionId = typeof record.headRevisionId === "string" ? record.headRevisionId : "";
      legacy.updatedAt = normalizeIso(record.headRevisionAt, legacy.updatedAt);
      return legacy;
    });
    return {
      version: SCHEMA_VERSION,
      generation: source.generation || "",
      savedAt: normalizeIso(source.savedAt),
      syncedAt: normalizeIso(source.syncedAt),
      records: records,
      deletedRecords: (Array.isArray(source.tombstones) ? source.tombstones : []).map(function (tombstone) {
        return {
          recordId: tombstone.recordId,
          deletedAt: tombstone.deletedAt,
          purged: Boolean(tombstone.purged),
          v4Tombstone: true
        };
      }),
      recurrenceCompletionArchive: clone(source.recurrenceCompletionArchive || []),
      journalStats: clone(source.journalStats || {})
    };
  }

  function layoutFromFiles(manifestPath, manifest, files) {
    if (!manifest || manifest.version !== SCHEMA_VERSION) {
      throw new Error("A v4 manifest is required.");
    }
    const copiedFiles = clone(files || {});
    copiedFiles[manifestPath] = clone(manifest);
    const hot = copiedFiles[manifest.hot.path];
    if (!hot) {
      throw new Error("The v4 hot file is required.");
    }
    return {
      version: SCHEMA_VERSION,
      basePath: manifestPath.replace(/\/manifest\.json$/, ""),
      manifestPath: manifestPath,
      manifest: copiedFiles[manifestPath],
      hot: hot,
      files: copiedFiles
    };
  }

  function recordChangeMetadata(record, fallbackAt, isNew) {
    const entries = (Array.isArray(record && record.history) ? record.history : [])
      .map(function (entry, index) {
        const at = normalizeIso(entry && entry.at);
        return at ? { entry: entry, at: at, index: index } : null;
      })
      .filter(Boolean)
      .sort(function (left, right) {
        const timeDifference = new Date(left.at).getTime() - new Date(right.at).getTime();
        return timeDifference || left.index - right.index;
      });
    const latest = entries[entries.length - 1];
    const at = latest && latest.at
      ? latest.at
      : normalizeIso(record && record.updatedAt,
        normalizeIso(isNew && record && record.createdAt, fallbackAt));
    return {
      action: latest && typeof latest.entry.action === "string" && latest.entry.action
        ? latest.entry.action
        : (isNew ? "created" : "edited"),
      at: at
    };
  }

  function mergeJsonItems(left, right) {
    const byKey = new Map();
    (Array.isArray(left) ? left : []).concat(Array.isArray(right) ? right : []).forEach(function (item) {
      byKey.set(stableStringify(item), clone(item));
    });
    return Array.from(byKey.values());
  }

  function compareRevisionHeads(left, right) {
    if (!left) {
      return -1;
    }
    if (!right) {
      return 1;
    }
    const timeDifference = new Date(left.at).getTime() - new Date(right.at).getTime();
    return timeDifference || left.id.localeCompare(right.id);
  }

  function findDescriptor(manifest, kind, pathValue) {
    return (manifest[kind] || []).find(function (item) {
      return item.path === pathValue;
    });
  }

  function descriptorForEnvelope(pathValue, envelope, mutable, maxBytes) {
    const items = envelope.kind === "revisions" ? envelope.revisions : envelope.entries;
    const dates = items.map(function (item) {
      return normalizeIso(envelope.kind === "revisions" ? item.at : item.deletedAt);
    }).filter(Boolean).sort();
    const text = jsonText(envelope);
    return {
      path: pathValue,
      open: Boolean(envelope.open),
      bytes: utf8Bytes(text).length,
      contentHash: sha256(text),
      mutable: Boolean(mutable),
      firstAt: dates[0] || "",
      lastAt: dates[dates.length - 1] || "",
      itemCount: items.length,
      oversize: utf8Bytes(text).length > (Number(maxBytes) || 250 * 1024)
    };
  }

  function nextShardPath(manifest, kind, month, basePath) {
    const pattern = new RegExp("/" + kind + "/" + month.replace("-", "\\-") + "-(\\d{3})\\.json$");
    const maximum = (manifest[kind] || []).reduce(function (current, descriptor) {
      const match = String(descriptor.path || "").match(pattern);
      return match ? Math.max(current, Number.parseInt(match[1], 10)) : current;
    }, 0);
    return basePath + "/" + kind + "/" + month + "-" + String(maximum + 1).padStart(3, "0") + ".json";
  }

  function appendOpenShard(layout, kind, additions, options) {
    const opts = options || {};
    const manifest = layout.manifest;
    const descriptorKey = kind;
    const openKey = kind === "revisions" ? "openRevisionShard" : "openTrashShard";
    const itemKey = kind === "revisions" ? "revisions" : "entries";
    const openPath = manifest[openKey];
    const openEnvelope = layout.files[openPath];
    if (!openEnvelope || !Array.isArray(openEnvelope[itemKey])) {
      throw new Error("The open " + kind + " shard is required before committing.");
    }
    const existingKeys = new Set(openEnvelope[itemKey].map(function (item) {
      return kind === "revisions" ? item.id : stableStringify([item.recordId, item.deletedAt, item.headRevisionId || ""]);
    }));
    const uniqueAdditions = (Array.isArray(additions) ? additions : []).filter(function (item) {
      const key = kind === "revisions" ? item.id : stableStringify([item.recordId, item.deletedAt, item.headRevisionId || ""]);
      if (existingKeys.has(key)) {
        return false;
      }
      existingKeys.add(key);
      return true;
    });
    if (!uniqueAdditions.length) {
      return { paths: [], itemPathById: {}, manifestChanged: false };
    }

    const now = normalizeIso(opts.now, new Date().toISOString());
    const month = now.slice(0, 7);
    const shardMaxBytes = manifest.limits && manifest.limits.shardBytes || 250 * 1024;
    const openMonthMatch = openPath.match(/\/(\d{4}-\d{2})-\d{3}\.json$/);
    const candidate = clone(openEnvelope);
    candidate[itemKey] = candidate[itemKey].concat(clone(uniqueAdditions));
    let shouldRoll = !openMonthMatch || openMonthMatch[1] !== month || jsonBytes(candidate) > shardMaxBytes;
    if (!openEnvelope[itemKey].length) {
      shouldRoll = false;
    }

    const paths = [];
    let targetPath = openPath;
    if (shouldRoll) {
      openEnvelope.open = false;
      const frozenDescriptor = descriptorForEnvelope(openPath, openEnvelope, false, shardMaxBytes);
      const descriptorIndex = (manifest[descriptorKey] || []).findIndex(function (item) { return item.path === openPath; });
      if (descriptorIndex !== -1) {
        manifest[descriptorKey][descriptorIndex] = frozenDescriptor;
      }
      paths.push(openPath);
      targetPath = nextShardPath(manifest, kind, month, layout.basePath);
      const nextEnvelope = buildShardEnvelope(kind, manifest.generation, true, clone(uniqueAdditions));
      layout.files[targetPath] = nextEnvelope;
      manifest[descriptorKey].push(descriptorForEnvelope(targetPath, nextEnvelope, true, shardMaxBytes));
      manifest[openKey] = targetPath;
      paths.push(targetPath);
    } else {
      openEnvelope[itemKey] = candidate[itemKey];
      layout.files[openPath] = openEnvelope;
      const descriptorIndex = (manifest[descriptorKey] || []).findIndex(function (item) {
        return item.path === openPath;
      });
      const currentDescriptor = descriptorForEnvelope(openPath, openEnvelope, true, shardMaxBytes);
      if (descriptorIndex !== -1) {
        manifest[descriptorKey][descriptorIndex] = currentDescriptor;
      } else {
        manifest[descriptorKey].push(currentDescriptor);
      }
      paths.push(openPath);
    }

    const itemPathById = {};
    uniqueAdditions.forEach(function (item) {
      itemPathById[kind === "revisions" ? item.id : item.recordId] = targetPath;
    });
    return {
      paths: paths,
      itemPathById: itemPathById,
      manifestChanged: true
    };
  }

  function reconcileV3Payload(layout, payload, options) {
    const opts = options || {};
    let next = layoutFromFiles(layout.manifestPath, layout.manifest, layout.files);
    let manifest = next.manifest;
    let hot = next.hot;
    const now = normalizeIso(opts.now, new Date().toISOString());
    const partialRevisions = [];
    Object.keys(next.files).forEach(function (pathValue) {
      const file = next.files[pathValue];
      if (file && file.kind === "revisions" && Array.isArray(file.revisions)) {
        partialRevisions.push.apply(partialRevisions, file.revisions);
      }
    });
    const knownRevisionsById = new Map(partialRevisions.map(function (revision) { return [revision.id, revision]; }));
    const currentRecords = new Map((hot.records || []).map(function (record) { return [record.id, record]; }));
    const snapshotRecords = collectLayoutSnapshots(next);
    const baseRecords = new Map(snapshotRecords.map(function (record) { return [record.id, record]; }));
    currentRecords.forEach(function (record, id) {
      baseRecords.set(id, record);
    });
    Object.keys(opts.baseRecordById || {}).forEach(function (id) {
      if (!baseRecords.has(id) && opts.baseRecordById[id]) {
        baseRecords.set(id, clone(opts.baseRecordById[id]));
      }
    });
    const currentTombstones = new Map((hot.tombstones || []).map(function (item) { return [item.recordId, item]; }));
    const incomingRecords = Array.isArray(payload && payload.records) ? payload.records : [];
    const incomingDeleted = Array.isArray(payload && payload.deletedRecords) ? payload.deletedRecords : [];
    const newRevisions = [];
    const recordForRevision = new Map();
    const touchedRecordIds = new Set();

    incomingRecords.forEach(function (record) {
      let canonical = null;
      try {
        canonical = canonicalizeRecord(record);
      } catch (error) {
        return;
      }
      const existing = currentRecords.get(canonical.id) || baseRecords.get(canonical.id);
      const metadata = recordChangeMetadata(record, now, !existing);
      const tombstone = currentTombstones.get(canonical.id);
      if (tombstone && new Date(tombstone.deletedAt).getTime() >= new Date(metadata.at).getTime()) {
        return;
      }
      if (tombstone) {
        currentTombstones.delete(canonical.id);
      }
      if (existing && stableStringify(canonicalizeRecord(existing)) === stableStringify(canonical)) {
        return;
      }
      touchedRecordIds.add(canonical.id);
      const parentRevisionId = typeof record.headRevisionId === "string" && record.headRevisionId
        ? record.headRevisionId
        : (opts.baseHeadByRecord && opts.baseHeadByRecord[canonical.id]) || (existing && existing.headRevisionId) || "";
      const revision = createFullRevision({
        record: canonical,
        action: metadata.action,
        at: metadata.at,
        parentRevisionIds: parentRevisionId ? [parentRevisionId] : []
      });
      newRevisions.push(revision);
      recordForRevision.set(revision.id, canonical);
      const currentHead = existing ? {
        id: existing.headRevisionId || "",
        at: normalizeIso(existing.headRevisionAt, existing.createdAt)
      } : null;
      if (!existing || compareRevisionHeads(revision, currentHead) >= 0) {
        currentRecords.set(canonical.id, Object.assign({}, canonical, {
          headRevisionId: revision.id,
          headRevisionAt: revision.at
        }));
      }
    });

    const trashEntries = [];
    incomingDeleted.forEach(function (entry) {
      const tombstone = normalizeTombstone(entry);
      if (!tombstone) {
        return;
      }
      touchedRecordIds.add(tombstone.recordId);
      const existingTombstone = currentTombstones.get(tombstone.recordId);
      if (existingTombstone && new Date(existingTombstone.deletedAt).getTime() > new Date(tombstone.deletedAt).getTime()) {
        return;
      }
      const existingRecord = currentRecords.get(tombstone.recordId) || baseRecords.get(tombstone.recordId);
      if (existingTombstone
        && !existingRecord
        && new Date(existingTombstone.deletedAt).getTime() === new Date(tombstone.deletedAt).getTime()) {
        return;
      }
      const archivedSource = !entry.purged && entry.record ? entry.record : existingRecord;
      if (!entry.purged && archivedSource) {
        const canonical = canonicalizeRecord(archivedSource);
        const parentRevisionId = typeof archivedSource.headRevisionId === "string" && archivedSource.headRevisionId
          ? archivedSource.headRevisionId
          : (existingRecord && existingRecord.headRevisionId) || "";
        const revision = createFullRevision({
          record: canonical,
          deleted: true,
          action: "deleted",
          at: tombstone.deletedAt,
          parentRevisionIds: parentRevisionId ? [parentRevisionId] : []
        });
        newRevisions.push(revision);
        recordForRevision.set(revision.id, canonical);
        trashEntries.push({
          recordId: tombstone.recordId,
          deletedAt: tombstone.deletedAt,
          headRevisionId: revision.id,
          record: Object.assign({}, canonical, {
            headRevisionId: revision.id,
            headRevisionAt: revision.at
          })
        });
      }
      currentRecords.delete(tombstone.recordId);
      currentTombstones.set(tombstone.recordId, tombstone);
    });

    const uniqueNewRevisions = [];
    const seenNewRevisionIds = new Set();
    newRevisions.forEach(function (revision) {
      const known = knownRevisionsById.get(revision.id);
      if (known && stableStringify(known) !== stableStringify(revision)) {
        throw new Error("Revision id collision during commit: " + revision.id);
      }
      if (!known && !seenNewRevisionIds.has(revision.id)) {
        seenNewRevisionIds.add(revision.id);
        uniqueNewRevisions.push(revision);
      }
    });

    const revisionAppend = appendOpenShard(next, "revisions", uniqueNewRevisions, { now: now });
    const trashAppend = appendOpenShard(next, "trash", trashEntries, { now: now });
    let manifestChanged = revisionAppend.manifestChanged || trashAppend.manifestChanged;
    ["revisions", "trash"].forEach(function (kind) {
      const openPath = kind === "revisions" ? manifest.openRevisionShard : manifest.openTrashShard;
      const envelope = next.files[openPath];
      const descriptorIndex = (manifest[kind] || []).findIndex(function (descriptor) {
        return descriptor.path === openPath;
      });
      if (!envelope || descriptorIndex === -1) {
        return;
      }
      const descriptor = descriptorForEnvelope(
        openPath,
        envelope,
        true,
        manifest.limits && manifest.limits.shardBytes
      );
      if (stableStringify(manifest[kind][descriptorIndex]) !== stableStringify(descriptor)) {
        manifest[kind][descriptorIndex] = descriptor;
        manifestChanged = true;
      }
    });
    uniqueNewRevisions.forEach(function (revision) {
      const shardPath = revisionAppend.itemPathById[revision.id] || manifest.openRevisionShard;
      const indexEntry = manifest.recordIndex[revision.recordId] || { location: "", revisionShards: [] };
      if (!indexEntry.revisionShards.includes(shardPath)) {
        indexEntry.revisionShards.push(shardPath);
        manifestChanged = true;
      }
      if (currentRecords.has(revision.recordId)) {
        indexEntry.location = manifest.hot.path;
      }
      indexEntry.headRevisionId = revision.id;
      indexEntry.headRevisionAt = revision.at;
      manifest.recordIndex[revision.recordId] = indexEntry;
    });
    trashEntries.forEach(function (entry) {
      const indexEntry = manifest.recordIndex[entry.recordId] || { location: "", revisionShards: [] };
      const trashPath = trashAppend.itemPathById[entry.recordId] || manifest.openTrashShard;
      if (indexEntry.location !== trashPath) {
        indexEntry.location = trashPath;
        manifestChanged = true;
      }
      indexEntry.headRevisionId = entry.headRevisionId || indexEntry.headRevisionId || "";
      indexEntry.headRevisionAt = normalizeIso(entry.deletedAt, indexEntry.headRevisionAt);
      manifest.recordIndex[entry.recordId] = indexEntry;
    });
    currentTombstones.forEach(function (tombstone) {
      if (!manifest.recordIndex[tombstone.recordId]) {
        manifest.recordIndex[tombstone.recordId] = { location: "", revisionShards: [] };
        manifestChanged = true;
      }
      if (tombstone.purged) {
        manifest.recordIndex[tombstone.recordId].location = "";
      }
    });

    hot.savedAt = normalizeIso(payload && payload.savedAt, now);
    hot.syncedAt = normalizeIso(payload && payload.syncedAt);
    hot.records = Array.from(currentRecords.values());
    hot.tombstones = Array.from(currentTombstones.values()).sort(function (left, right) {
      return left.recordId.localeCompare(right.recordId);
    });
    hot.recurrenceCompletionArchive = mergeJsonItems(hot.recurrenceCompletionArchive, payload && payload.recurrenceCompletionArchive);
    hot.journalStats = clone(payload && payload.journalStats || hot.journalStats || {});
    next.files[manifest.hot.path] = hot;
    next.hot = hot;

    let currentStats = null;
    if (hasCompleteSnapshotFiles(next)) {
      currentStats = computeCurrentStats(collectLayoutSnapshots(next).concat(Array.from(currentRecords.values())));
    } else if (manifest.currentStats) {
      currentStats = normalizeCurrentStats(manifest.currentStats);
      touchedRecordIds.forEach(function (recordId) {
        const previous = baseRecords.get(recordId);
        if (previous) {
          adjustCurrentStats(currentStats, previous, -1);
        }
        const current = currentRecords.get(recordId);
        const indexEntry = manifest.recordIndex[recordId];
        if (current && indexEntry && indexEntry.location === manifest.hot.path) {
          adjustCurrentStats(currentStats, current, 1);
        }
      });
      currentStats = normalizeCurrentStats(currentStats);
    } else if (!(manifest.snapshots || []).length) {
      currentStats = computeCurrentStats(Array.from(currentRecords.values()));
    }
    if (currentStats
      && stableStringify(normalizeCurrentStats(manifest.currentStats)) !== stableStringify(currentStats)) {
      manifest.currentStats = currentStats;
      manifestChanged = true;
    }

    const hotText = jsonText(hot);
    const warningBytes = manifest.snapshotPolicy
      ? normalizeSnapshotPolicy(manifest.snapshotPolicy).warningBytes
      : (manifest.limits && manifest.limits.hotBytes || DEFAULT_SNAPSHOT_POLICY.warningBytes);
    const hotDescriptor = {
      path: manifest.hot.path,
      bytes: utf8Bytes(hotText).length,
      contentHash: sha256(hotText),
      mutable: true,
      oversize: utf8Bytes(hotText).length > warningBytes
    };
    if (stableStringify(manifest.hot) !== stableStringify(hotDescriptor)) {
      manifest.hot = hotDescriptor;
      manifestChanged = true;
    }

    let archival = {
      changed: false,
      snapshotPaths: []
    };
    if (manifest.snapshotPolicy && normalizeSnapshotPolicy(manifest.snapshotPolicy).enabled) {
      archival = archiveEligibleHotRecords(next, { now: now });
      if (archival.changed) {
        next = archival.layout;
        manifest = next.manifest;
        hot = next.hot;
        manifestChanged = true;
      }
    }
    if (manifestChanged) {
      manifest.updatedAt = now;
      next.files[next.manifestPath] = manifest;
    }
    const writes = [];
    revisionAppend.paths.forEach(function (pathValue) {
      writes.push({ role: "revision", path: pathValue, value: next.files[pathValue] });
    });
    trashAppend.paths.forEach(function (pathValue) {
      writes.push({ role: "trash", path: pathValue, value: next.files[pathValue] });
    });
    archival.snapshotPaths.forEach(function (pathValue) {
      writes.push({ role: "snapshot", path: pathValue, value: next.files[pathValue] });
    });
    if (manifestChanged) {
      writes.push({ role: "manifest", path: next.manifestPath, value: manifest });
    }
    writes.push({ role: "hot", path: manifest.hot.path, value: hot });
    return {
      layout: next,
      writes: writes,
      newRevisions: uniqueNewRevisions,
      archivedRecords: archival.candidates || [],
      manifestChanged: manifestChanged,
      payload: payloadFromV4Hot(hot)
    };
  }

  function nodeModules() {
    if (typeof require !== "function") {
      throw new Error("Repository file access is only available in Node.js.");
    }
    return {
      fs: require("fs"),
      path: require("path")
    };
  }

  function readJsonUtf8(filePath) {
    const modules = nodeModules();
    return JSON.parse(modules.fs.readFileSync(filePath, "utf8"));
  }

  function writeJsonUtf8(filePath, value) {
    const modules = nodeModules();
    modules.fs.mkdirSync(modules.path.dirname(filePath), { recursive: true });
    modules.fs.writeFileSync(filePath, jsonText(value), "utf8");
  }

  function readV4Layout(repoRoot, options) {
    const modules = nodeModules();
    const opts = options || {};
    const basePath = String(opts.basePath || "minimal-notes-sync").replace(/^\/+|\/+$/g, "");
    const manifestPath = basePath + "/manifest.json";
    const manifest = readJsonUtf8(modules.path.join(repoRoot, manifestPath));
    if (!manifest || manifest.version !== SCHEMA_VERSION) {
      throw new Error("Unsupported Minimal Notes manifest schema.");
    }
    const filePaths = [manifest.hot.path]
      .concat((manifest.snapshots || []).map(function (item) { return item.path; }))
      .concat((manifest.revisions || []).map(function (item) { return item.path; }))
      .concat((manifest.trash || []).map(function (item) { return item.path; }));
    const files = {};
    files[manifestPath] = manifest;
    filePaths.forEach(function (relativePath) {
      if (relativePath && !files[relativePath]) {
        files[relativePath] = readJsonUtf8(modules.path.join(repoRoot, relativePath));
      }
    });
    return {
      version: SCHEMA_VERSION,
      basePath: basePath,
      manifestPath: manifestPath,
      manifest: manifest,
      hot: files[manifest.hot.path],
      files: files
    };
  }

  function writeV4Layout(repoRoot, layout) {
    const modules = nodeModules();
    const paths = Object.keys(layout.files || {}).filter(function (relativePath) {
      return relativePath !== layout.manifestPath;
    });
    paths.forEach(function (relativePath) {
      writeJsonUtf8(modules.path.join(repoRoot, relativePath), layout.files[relativePath]);
    });
    writeJsonUtf8(modules.path.join(repoRoot, layout.manifestPath), layout.manifest);
  }

  function readRepositoryPayload(repoRoot, options) {
    const modules = nodeModules();
    const opts = options || {};
    const basePath = String(opts.basePath || "minimal-notes-sync").replace(/^\/+|\/+$/g, "");
    const manifestFile = modules.path.join(repoRoot, basePath, "manifest.json");
    if (modules.fs.existsSync(manifestFile)) {
      const layout = readV4Layout(repoRoot, { basePath: basePath });
      return {
        format: "v4",
        layout: layout,
        payload: exportV3Snapshot(layout)
      };
    }
    const legacyPath = modules.path.join(repoRoot, opts.legacyPath || "minimal-notes-records.json");
    return {
      format: "v3",
      layout: null,
      payload: readJsonUtf8(legacyPath)
    };
  }

  function commitRepositoryPayload(repoRoot, payload, options) {
    const modules = nodeModules();
    const opts = options || {};
    const loaded = readRepositoryPayload(repoRoot, opts);
    if (loaded.format === "v3") {
      const legacyPath = modules.path.join(repoRoot, opts.legacyPath || "minimal-notes-records.json");
      writeJsonUtf8(legacyPath, payload);
      return { format: "v3", payload: payload, writes: [{ role: "legacy", path: opts.legacyPath || "minimal-notes-records.json" }] };
    }
    const reconciled = reconcileV3Payload(loaded.layout, payload, {
      now: opts.now || payload.savedAt || new Date().toISOString(),
      baseHeadByRecord: opts.baseHeadByRecord || {}
    });
    reconciled.writes.forEach(function (write) {
      writeJsonUtf8(modules.path.join(repoRoot, write.path), write.value);
    });
    return {
      format: "v4",
      payload: reconciled.payload,
      writes: reconciled.writes,
      newRevisions: reconciled.newRevisions,
      manifestChanged: reconciled.manifestChanged
    };
  }

  return {
    DEFAULT_SNAPSHOT_POLICY: clone(DEFAULT_SNAPSHOT_POLICY),
    RECORD_TYPES: RECORD_TYPES.slice(),
    REVISION_ENCODING: REVISION_ENCODING,
    SCHEMA_VERSION: SCHEMA_VERSION,
    canonicalizeRecord: canonicalizeRecord,
    canonicalizeState: canonicalizeState,
    archiveEligibleHotRecords: archiveEligibleHotRecords,
    createFullRevision: createFullRevision,
    dedupeRevisions: dedupeRevisions,
    buildV4Layout: buildV4Layout,
    buildSnapshotDescriptor: buildSnapshotDescriptor,
    buildSnapshotEnvelope: buildSnapshotEnvelope,
    collectLayoutRevisions: collectLayoutRevisions,
    collectLayoutSnapshots: collectLayoutSnapshots,
    collectLayoutTrash: collectLayoutTrash,
    commitRepositoryPayload: commitRepositoryPayload,
    computeCurrentStats: computeCurrentStats,
    exportV3Snapshot: exportV3Snapshot,
    hashState: hashState,
    getSnapshotEligibility: getSnapshotEligibility,
    jsonBytes: jsonBytes,
    jsonText: jsonText,
    layoutFromFiles: layoutFromFiles,
    migrateRecordRevisions: migrateRecordRevisions,
    migrateV3Payload: migrateV3Payload,
    normalizeCurrentStats: normalizeCurrentStats,
    normalizeIso: normalizeIso,
    normalizeRecurrence: normalizeRecurrence,
    normalizeRecurrenceCompletions: normalizeRecurrenceCompletions,
    normalizeSnapshotPolicy: normalizeSnapshotPolicy,
    payloadFromV4Hot: payloadFromV4Hot,
    reconcileV3Payload: reconcileV3Payload,
    sha256: sha256,
    stableStringify: stableStringify,
    utf8Bytes: utf8Bytes,
    updateCurrentStats: updateCurrentStats,
    readJsonUtf8: readJsonUtf8,
    readRepositoryPayload: readRepositoryPayload,
    readV4Layout: readV4Layout,
    validateRevision: validateRevision,
    validateV4Layout: validateV4Layout,
    writeJsonUtf8: writeJsonUtf8,
    writeV4Layout: writeV4Layout
  };
}));
