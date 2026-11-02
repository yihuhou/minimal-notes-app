(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) { module.exports = factory(require("./vendor/solarlunar-3.1.0.min.js").default); }
  else { root.MinimalNotesBirthdays = factory(root.solarLunar && root.solarLunar.default); }
}(typeof globalThis !== "undefined" ? globalThis : this, function (solarLunar) {
  "use strict";
  const ZONE = "Asia/Shanghai";
  const OFFSET = 8 * 60 * 60 * 1000;
  const DAY = 24 * 60 * 60 * 1000;

  function exactKeys(value, keys) {
    return value && typeof value === "object" && !Array.isArray(value)
      && Object.keys(value).length === keys.length
      && keys.every(function (key) { return Object.prototype.hasOwnProperty.call(value, key); });
  }

  function validatePayload(payload) {
    if (!exactKeys(payload, ["schemaVersion", "timeZone", "birthdays"])
      || payload.schemaVersion !== 1 || payload.timeZone !== ZONE
      || !Array.isArray(payload.birthdays) || payload.birthdays.length > 500) {
      throw new Error("生日数据格式不正确");
    }
    const ids = new Set();
    payload.birthdays.forEach(function (person) {
      if (!exactKeys(person, ["id", "name", "displayName", "calendar", "month", "day", "isLeapMonth"])
        || typeof person.id !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(person.id) || ids.has(person.id)
        || [person.name, person.displayName].some(function (value) { return typeof value !== "string" || !value.trim() || value.length > 80 || /[\u0000-\u001f\u007f]/.test(value); })
        || !["solar", "lunar"].includes(person.calendar)
        || !Number.isInteger(person.month) || person.month < 1 || person.month > 12
        || !Number.isInteger(person.day) || person.day < 1
        || typeof person.isLeapMonth !== "boolean") {
        throw new Error("生日条目格式不正确");
      }
      const maxDay = person.calendar === "lunar" ? 30 : [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][person.month - 1];
      if (person.day > maxDay || (person.calendar === "solar" && person.isLeapMonth)) { throw new Error("生日日期不正确"); }
      ids.add(person.id);
    });
    return payload;
  }

  function timestamp(now) {
    const value = now == null ? Date.now() : new Date(now).getTime();
    if (!Number.isFinite(value)) { throw new Error("Invalid current date"); }
    return value;
  }

  function getDay(now) {
    // Modern birthday reminders use Shanghai's UTC+08:00 calendar day, never
    // the viewer's device zone or the journal's 04:00 workday boundary.
    const shifted = new Date(timestamp(now) + OFFSET);
    const date = shifted.toISOString().slice(0, 10);
    return { date: date, year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
  }

  function getLunarDay(now) {
    try {
      const day = getDay(now);
      if (!solarLunar || typeof solarLunar.solar2lunar !== "function" || day.year < 1900 || day.year > 2100) { return null; }
      const lunar = solarLunar.solar2lunar(day.year, day.month, day.day);
      if (!lunar || !Number.isInteger(lunar.lMonth) || lunar.lMonth < 1 || lunar.lMonth > 12
        || !Number.isInteger(lunar.lDay) || lunar.lDay < 1 || lunar.lDay > 30
        || typeof lunar.isLeap !== "boolean") { return null; }
      return { month: lunar.lMonth, day: lunar.lDay, isLeapMonth: lunar.isLeap };
    } catch (error) { return null; }
  }

  function matching(payload, now) {
    validatePayload(payload);
    const today = getDay(now);
    const lunar = payload.birthdays.some(function (person) { return person.calendar === "lunar"; }) ? getLunarDay(now) : null;
    return {
      date: today.date,
      birthdays: payload.birthdays.filter(function (person) {
        const day = person.calendar === "solar" ? today : lunar;
        return day && person.month === day.month && person.day === day.day
          && (person.calendar === "solar" || person.isLeapMonth === day.isLeapMonth);
      })
    };
  }

  function nextMidnightDelay(now) {
    const time = timestamp(now);
    return DAY - ((time + OFFSET) % DAY + DAY) % DAY;
  }

  function getReminderDay(now) { return getDay(timestamp(now) - 5 * 60 * 60 * 1000).date; }
  function canNotify(now) { return new Date(timestamp(now) + OFFSET).getUTCHours() >= 5; }
  function nextReminderDelay(now) { return nextMidnightDelay(timestamp(now) - 5 * 60 * 60 * 1000); }

  return { validatePayload: validatePayload, getDay: getDay, getLunarDay: getLunarDay, matching: matching,
    getReminderDay: getReminderDay, canNotify: canNotify, nextReminderDelay: nextReminderDelay };
}));
