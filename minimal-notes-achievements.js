(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.MinimalNotesAchievements = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DAY = 86400000;
  const WRITING_MILESTONES = {
    day: [2000, 3000, 4000, 5000, 6000],
    week: [8000, 10000, 12000, 14000, 16000],
    month: [30000, 40000, 50000],
    year: [100000, 150000, 200000, 250000]
  };
  const GROUPS = [
    { id: "streak", title: "日日有记", family: "presence", icon: "day" },
    { id: "weekly", title: "周周有记", family: "presence", icon: "week" },
    { id: "monthly", title: "月月有记", family: "presence", icon: "month" },
    { id: "rhythm", title: "每日千字", family: "practice", icon: "day", writing: true },
    { id: "weekly-words", title: "每周五千字", family: "practice", icon: "week", writing: true },
    { id: "serial", title: "每月两万字", family: "practice", icon: "month", writing: true },
    { id: "thousand", title: "千字积累", family: "accumulation", icon: "stack", writing: true },
    { id: "days", title: "日常积累", family: "accumulation", icon: "stack" },
    { id: "words", title: "写作长卷", family: "accumulation", icon: "scroll" },
    { id: "calendar", title: "日历收藏", family: "calendar", icon: "year" }
  ];
  const BADGES = [];
  function add(group, metric, targets, names, rule, unit, requiresDailyCharacters, streakKey) {
    targets.forEach(function (target, index) {
      BADGES.push({ id: metric + "-" + target, group: group, metric: metric, target: target,
        name: names[index], rule: rule(target), unit: unit,
        tier: BADGES.filter(badge => badge.group === group).length + 1,
        requiresDailyCharacters: Boolean(requiresDailyCharacters), streakKey: streakKey || "" });
    });
  }
  add("streak", "longestStreak", [200, 365, 730, 1095],
    ["两百日长续", "一年不辍", "两年不辍", "三年不辍"],
    n => "连续 " + n + " 天，每天都有记录", "天", false, "daily");
  add("weekly", "consecutiveWeeks", [52, 104, 156, 208],
    ["一载相见", "两载相见", "三载相见", "四载相见"],
    n => "连续 " + n + " 周，每周都有记录", "周", false, "weekly");
  add("monthly", "consecutiveMonths", [12, 24, 36, 48],
    ["一年相伴", "两年相伴", "三年相伴", "四年相伴"],
    n => "连续 " + n + " 个月，每月都有记录", "个月", false, "monthly");
  add("rhythm", "thousandCharacterStreak", [14, 30, 60, 100],
    ["两周千言", "满月千言", "双月千言", "百日千言"],
    n => "连续 " + n + " 天，每天写下至少 1,000 字", "天", true, "thousand");
  add("weekly-words", "fiveThousandCharacterWeeks", [26, 52, 104, 156],
    ["半载成章", "一载成章", "两载成章", "三载成章"],
    n => "连续 " + n + " 周，每周写下至少 5,000 字", "周", true, "weeklyWords");
  add("serial", "twentyThousandCharacterMonths", [12, 24, 36, 48],
    ["一年长卷", "两年长卷", "三年长卷", "四年长卷"],
    n => "连续 " + n + " 个月，每月写下至少 20,000 字", "个月", true, "monthlyWords");
  add("thousand", "thousandCharacterDays", [500, 1000, 1500, 2000],
    ["千言成习", "千言成卷", "千言成林", "千言成河"],
    n => "累计 " + n.toLocaleString("en-US") + " 天，每天写下至少 1,000 字", "天", true);
  add("days", "totalDays", [1000, 1500, 2000, 2500],
    ["日久成习", "日久成册", "日久成卷", "日久成史"],
    n => "累计写日记 " + n.toLocaleString("en-US") + " 天", "天");
  add("words", "totalCharacters", [1000000, 2000000, 3000000, 4000000],
    ["百万字长卷", "两百万字长卷", "三百万字长卷", "四百万字长卷"],
    n => "累计写下 " + (n / 10000) + " 万字", "字");
  [1, 2, 3, 4].forEach(function (years) {
    add("calendar", "calendarCoverage" + years, [365],
      [years === 1 ? "岁时初圆" : years === 2 ? "岁时重逢"
        : years === 3 ? "岁时三叠" : "岁时四叠"],
      () => years === 1 ? "集齐 365 个写过日记的日期"
        : "365 个日期，各在至少 " + years + " 个年份写过日记", "个日期");
  });

  // Each series has an illustration, held in a porcelain setting with a silver rim.
  // IDs are unique because the earned shelf and series shelf can show the same medal.
  let medalSequence = 0;
  function medalSvg(groupId, tier) {
    const group = GROUPS.find(item => item.id === groupId) || GROUPS[0];
    const level = Math.max(1, Math.min(4, Math.trunc(Number(tier)) || 1));
    const id = "journal-medal-" + (++medalSequence);
    const metal = 'url(#' + id + '-metal)';
    const enamel = 'url(#' + id + '-enamel)';
    const paper = 'var(--medal-paper, #546c80)';
    const gold = 'var(--medal-gold, #9bb4cc)';
    const ink = 'var(--medal-deep, #e9eef3)';
    const star = (x, y, r) => '<path d="M' + x + ' ' + (y - r) + 'q0 ' + r + ' ' + r + ' ' + r
      + 'q-' + r + ' 0-' + r + ' ' + r + 'q0-' + r + '-' + r + '-' + r
      + 'q' + r + ' 0 ' + r + '-' + r + 'Z" fill="' + gold + '" stroke="none"/>';
    // Coordinates leave a clear border around each illustration at phone sizes.
    const motifs = {
      streak: '<path d="M40 57a16 16 0 0 1 32 0Z" fill="' + gold + '" stroke="none"/>'
        + '<path d="M56 29v6m-19 2 4 4m34-4-4 4M30 53h5m42 0h5" stroke="' + gold + '"/>'
        + '<path d="M32 59h48M39 65h34M48 71h16"/>',
      weekly: '<path d="m33 57 9-15 14 10 14-16 10 21-16 12-16-3Z" stroke="' + gold + '" opacity=".65"/>'
        + [[33, 57], [42, 42], [56, 52], [70, 36], [80, 57], [64, 69], [48, 66]].map(([x, y]) =>
          '<circle cx="' + x + '" cy="' + y + '" r="3.2" fill="' + paper + '" stroke="' + ink + '" stroke-width="1.3"/>'
        ).join('') + star(70, 36, 5),
      monthly: '<path d="M64 31a22 22 0 1 0 15 32A23 23 0 0 1 64 31Z" fill="' + paper + '" stroke="none"/>'
        + '<path d="M42 37a19 19 0 0 0 4 34" stroke="' + gold + '" stroke-width="1.2"/>'
        + star(73, 39, 5) + star(80, 51, 2.6),
      rhythm: '<path d="m56 29-14 24 6 15h16l6-15Z" fill="' + paper + '" stroke="none"/>'
        + '<path d="m56 29 14 24-6 15h-8Z" fill="' + gold + '" stroke="none"/>'
        + '<path d="M56 32v21" stroke="' + ink + '"/><circle cx="56" cy="55" r="3.3" fill="' + ink + '" stroke="none"/>'
        + '<path d="M48 73h16" stroke="' + gold + '" stroke-width="3"/>' + star(77, 38, 3),
      "weekly-words": '<path d="M40 67C32 43 55 28 77 31c0 23-12 39-32 35Z" fill="' + paper + '" stroke="none"/>'
        + '<path d="M43 66c18-2 30-18 34-35L55 52Z" fill="' + gold + '" stroke="none"/>'
        + '<path d="m37 74 33-36m-17 19-10-1m18-10-9-1m3 10 10-1" stroke="' + ink + '" stroke-width="1.6"/>'
        + '<path d="m37 74 8-9" stroke="' + gold + '" stroke-width="2.2"/>',
      serial: '<path d="M32 36q12-5 24 3 12-8 24-3v34q-12-5-24 3-12-8-24-3Z" fill="' + paper + '" stroke="none"/>'
        + '<path d="M56 39q12-8 24-3v34q-12-5-24 3Z" fill="' + gold + '" stroke="none"/>'
        + '<path d="M56 40v31m-17-26q6-1 11 2m-11 5q6-1 11 2m-11 5q6-1 11 2m12-16q6-3 11-2m-11 9q6-3 11-2" stroke="' + ink + '" stroke-width="1.5"/>'
        + '<path d="M67 34v20l4-3 4 1V33" fill="' + ink + '" stroke="none"/>',
      thousand: '<rect x="33" y="40" width="12" height="32" rx="2" fill="' + paper + '" stroke="none"/>'
        + '<rect x="48" y="32" width="13" height="40" rx="2" fill="' + gold + '" stroke="none"/>'
        + '<path d="m63 41 10-3 9 31-10 3Z" fill="' + paper + '" stroke="none"/>'
        + '<path d="M36 47h6m-6 18h6m9-25h7m-7 24h7m-3-17v10m13-12 5-1" stroke="' + ink + '" stroke-width="1.5"/>'
        + '<path d="M31 76h51" stroke="' + gold + '"/>',
      days: '<path d="M56 73V42m0 14L44 44m12 19 14-14" stroke="' + gold + '" stroke-width="2.5"/>'
        + '<path d="M56 44C44 39 47 30 56 27c9 7 8 13 0 17Zm-9 12C34 55 32 46 34 39c12 0 18 8 13 17Zm18 5c-4-11 3-20 15-20 1 11-4 18-15 20Z" fill="' + paper + '" stroke="none"/>'
        + '<path d="M56 67C45 66 41 61 39 56c10-2 17 1 17 11Z" fill="' + gold + '" stroke="none"/>'
        + '<path d="M44 76h24"/>',
      words: '<path d="M38 33h32v38H43a6 6 0 0 1-6-6V39Z" fill="' + paper + '" stroke="none"/>'
        + '<path d="M38 33h32a6 6 0 0 1 6 6v4H65v-4a6 6 0 0 1 5-6M38 33a6 6 0 0 1 5 6v4H32v-4a6 6 0 0 1 6-6M37 65h26v3a5 5 0 0 0 10 0v-3h6v3a9 9 0 0 1-9 9H45a8 8 0 0 1-8-8Z" fill="' + gold + '" stroke="none"/>'
        + '<path d="M49 44h10m-10 7h15m-15 7h12" stroke="' + ink + '" stroke-width="1.5"/>',
      calendar: '<path d="M36 66q-13-18 2-32M76 66q13-18-2-32" stroke="' + gold + '" stroke-width="1.4"/>'
        + '<path d="M34 54q-13-1-9-12 10 1 9 12m1-9q-7-9 2-15 7 7-2 15m43 9q13-1 9-12-10 1-9 12m-1-9q7-9-2-15-7 7 2 15" fill="' + gold + '" stroke="none"/>'
        + '<rect x="40" y="39" width="32" height="32" rx="4" fill="' + paper + '" stroke="none"/>'
        + '<path d="M40 48h32m-24-13v8m16-8v8" stroke="' + ink + '"/>'
        + '<path d="m49 58 5 5 10-10" stroke="' + ink + '" stroke-width="2.5"/>'
    };
    const silhouettes = {
      presence: '<circle cx="56" cy="53" r="46"',
      practice: '<path d="M43 8q13-7 26 0l9 5 10 5q13 7 13 22v26q0 14-13 22l-19 11q-13 7-26 0L24 88Q11 80 11 66V40q0-15 13-22Z"',
      accumulation: '<path d="m56 5 35 17q8 4 8 13v34q0 9-8 14l-27 17q-8 5-16 0L21 83q-8-5-8-14V35q0-9 8-13Z"',
      calendar: '<path d="M56 5c11 0 14 8 21 11s15 0 21 10 0 16 1 24 7 15 2 25-14 10-21 15-12 13-24 13-17-8-24-13S16 85 11 75s1-17 2-25-5-14 1-24 14-7 21-10S45 5 56 5Z"'
    };
    const shape = silhouettes[group.family];
    const grades = Array.from({ length: level }, (_, index) => star(56 + (index - (level - 1) / 2) * 9, 22, 2.4)).join('');
    const engraving = level > 1 ? '<g fill="none" stroke="' + gold + '" stroke-linecap="round" opacity=".75">'
      + '<path d="M26 72q4 8 12 12m36 0q8-4 12-12" stroke-width="1.4"/>'
      + (level > 2 ? '<path d="m29 77-5-1m9 6-5 1m55-6 5-1m-9 6 5 1" stroke-width="1.5"/>' : '')
      + '</g>' : '';
    const numerals = [
      'M56 96v9m-3-9h6m-6 9h6',
      'M53 96v9m6-9v9m-9-9h12m-12 9h12',
      'M50 96v9m6-9v9m6-9v9m-15-9h18m-18 9h18',
      'M49 96v9m-3-9h6m-6 9h6m3-9 4 9 4-9'
    ];
    return '<svg xmlns="http://www.w3.org/2000/svg" class="achievement-medal" viewBox="0 0 112 120" aria-hidden="true" focusable="false">'
      + '<defs><linearGradient id="' + id + '-metal" x1="0" y1="0" x2=".8" y2="1">'
      + '<stop stop-color="var(--medal-metal-light, #ffffff)"/><stop offset=".45" stop-color="var(--medal-metal, #dce0e3)"/>'
      + '<stop offset=".7" stop-color="var(--medal-metal-light, #ffffff)"/><stop offset="1" stop-color="var(--medal-metal-dark, #a8b0b7)"/></linearGradient>'
      + '<linearGradient id="' + id + '-enamel" x1="0" y1="0" x2=".65" y2="1">'
      + '<stop stop-color="var(--medal-light, #ffffff)"/><stop offset="1" stop-color="' + ink + '"/></linearGradient></defs>'
      + '<ellipse cx="56" cy="113" rx="27" ry="3" fill="var(--medal-shadow, #64758a)" opacity=".09"/>'
      + shape + ' fill="' + metal + '" stroke="var(--medal-metal-dark, #a8b0b7)" stroke-width=".8"/>'
      + '<g transform="translate(56 53) scale(.93) translate(-56 -53)">'
      + shape + ' fill="' + enamel + '" stroke="' + paper + '" stroke-opacity=".5" stroke-width=".7"/></g>'
      + '<circle cx="56" cy="53" r="37.5" fill="none" stroke="' + gold + '" stroke-width=".7" opacity=".5"/>'
      + '<path d="M22 46a35 35 0 0 1 30-28" fill="none" stroke="' + paper + '" stroke-width="1.1" opacity=".25"/>'
      + grades + '<g fill="none" stroke="' + paper + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
      + motifs[group.id] + '</g>' + engraving
      + (level === 4 ? star(56, 84, 4) : '<circle cx="56" cy="83" r="1.5" fill="' + gold + '"/>')
      + '<path d="M40 92h32v13l-16 7-16-7Z" fill="' + metal + '" stroke="var(--medal-metal-dark, #a8b0b7)" stroke-width=".7"/>'
      + '<path d="M43 94h26v9l-13 6-13-6Z" fill="' + ink + '"/>'
      + '<path d="' + numerals[level - 1] + '" fill="none" stroke="' + paper + '" stroke-width="1.35" stroke-linecap="round"/>'
      + '</svg>';
  }

  function validDay(day) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
    const time = Date.parse(day + "T00:00:00Z");
    return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === day;
  }
  function dayNumber(day) { return Date.parse(day + "T00:00:00Z") / DAY; }
  function dayKey(number) { return new Date(number * DAY).toISOString().slice(0, 10); }
  function journalDay(now) {
    return new Date(new Date(now === undefined ? Date.now() : now).getTime() + 3 * 3600000)
      .toISOString().slice(0, 10);
  }
  function count(value) { return Number.isSafeInteger(value) && value > 0 ? value : 0; }

  function firstStreakAchievement(values, target, step, label, achievedByPeriod) {
    let previous = null;
    let length = 0;
    const periods = Array.from(new Set(values)).sort((a, b) => a - b);
    for (const period of periods) {
      length = previous !== null && period === previous + step ? length + 1 : 1;
      if (length >= target) return achievedByPeriod && achievedByPeriod.get(period) || label(period);
      previous = period;
    }
    return "";
  }

  function cumulativeAchievement(days, target, value) {
    let total = 0;
    for (const day of days) {
      total += value(day);
      if (total >= target) return day;
    }
    return "";
  }

  function newestFirst(badges) {
    return badges.slice().sort(function (left, right) {
      return String(right.achievedAt || "").localeCompare(String(left.achievedAt || ""));
    });
  }

  function streaks(values, currentPeriod, step, label) {
    const runs = [];
    Array.from(new Set(values)).sort((a, b) => a - b).forEach(function (number) {
      const last = runs[runs.length - 1];
      if (last && number === last.end + step) { last.end = number; last.length += 1; }
      else runs.push({ start: number, end: number, length: 1 });
    });
    const format = run => run ? { start: label(run.start), end: label(run.end), length: run.length } : null;
    const longest = runs.reduce((best, run) => Math.max(best, run.length), 0);
    const last = runs[runs.length - 1];
    const current = last && last.end >= currentPeriod - step ? last : null;
    return { longest: longest, current: current ? current.length : 0,
      previousBest: runs.filter(run => run !== current).reduce((best, run) => Math.max(best, run.length), 0),
      currentRange: format(current), currentQualified: Boolean(current && current.end === currentPeriod),
      longestRanges: runs.filter(run => run.length === longest).reverse().map(format) };
  }

  function buildCalendar(days, today) {
    const yearsByDate = {};
    days.forEach(function (day) {
      const md = day.slice(5);
      if (!yearsByDate[md]) yearsByDate[md] = [];
      yearsByDate[md].push(day.slice(0, 4));
    });
    const dates = Array.from({ length: 365 }, function (_, index) {
      const md = dayKey(dayNumber("2025-01-01") + index).slice(5);
      const years = yearsByDate[md] || [];
      let next = today.slice(0, 4) + "-" + md;
      if (next < today || years.includes(today.slice(0, 4))) next = (Number(today.slice(0, 4)) + 1) + "-" + md;
      return { date: md, years: years, count: years.length, next: next };
    });
    return { dates: dates, leapYears: yearsByDate["02-29"] || [],
      levels: [1, 2, 3, 4].map(function (years) {
        const coveredDates = dates.filter(day => day.count >= years);
        return { years: years, covered: coveredDates.length,
          achievedAt: coveredDates.length === dates.length
            ? coveredDates.map(day => day.years[years - 1] + "-" + day.date).sort().pop() : "",
          missing: dates.filter(day => day.count < years).sort((a, b) => a.next.localeCompare(b.next)) };
      }) };
  }

  function compute(current, historical, now) {
    current = current || {};
    historical = historical || {};
    const today = journalDay(now);
    const todayNumber = dayNumber(today);
    // V4 keys use 05:00 journal days; historical keys use archive calendar dates.
    // Both maps already contain their final dates; merge without shifting again.
    const currentDays = Object.keys(current.userJournalByDate || {}).filter(function (day) {
      return validDay(day) && day <= today && count(current.userJournalByDate[day]);
    });
    const dates = new Set(currentDays);
    const characters = {};
    const historicalDays = historical.charactersByDate || {};
    Object.keys(historicalDays).forEach(function (day) {
      if (validDay(day) && day <= today && count(historicalDays[day])) dates.add(day);
    });
    [current.userJournalCharactersByDate || {}, historicalDays].forEach(function (map) {
      Object.keys(map).forEach(function (day) {
        if (dates.has(day)) characters[day] = (characters[day] || 0) + count(map[day]);
      });
    });
    const days = Array.from(dates).sort();
    const metrics = { totalDays: days.length,
      totalCharacters: count(current.userJournalCharacters) + count(historical.characters),
      longestStreak: 0, currentStreak: 0, perfectWeeks: 0, perfectMonths: 0,
      bestDayCharacters: 0, bestDay: "", seasons: 0, consecutiveMonths: 0,
      weekendPairs: 0, newYearPairs: 0, returns: 0, leapDays: 0,
      hundredCharacterStreak: 0, threeHundredCharacterStreak: 0, thousandCharacterStreak: 0,
      thousandCharacterDays: 0, fiveThousandCharacterWeeks: 0,
      bestWeekCharacters: 0, bestWeek: "", bestMonthCharacters: 0,
      bestMonth: "", tenThousandCharacterMonths: 0, bestWeekendCharacters: 0, bestYearCharacters: 0 };
    const weeks = new Map();
    const months = new Map();
    const seasons = new Map();
    const weekCharacters = new Map();
    const monthCharacters = new Map();
    const yearCharacters = new Map();
    const firstDayByWeek = new Map();
    const firstDayByMonth = new Map();
    const weeklyWordsAchievedAt = new Map();
    const monthlyWordsAchievedAt = new Map();
    const characterRuns = [
      { minimum: 100, metric: "hundredCharacterStreak", run: 0 },
      { minimum: 300, metric: "threeHundredCharacterStreak", run: 0 },
      { minimum: 1000, metric: "thousandCharacterStreak", run: 0 }
    ];
    let previous = null;
    let run = 0;
    days.forEach(function (day) {
      const number = dayNumber(day);
      const date = new Date(number * DAY);
      const weekday = date.getUTCDay();
      const month = date.getUTCMonth();
      const year = date.getUTCFullYear();
      const consecutive = previous !== null && number - previous === 1;
      run = consecutive ? run + 1 : 1;
      metrics.longestStreak = Math.max(metrics.longestStreak, run);
      if (previous !== null && number - previous >= 8) metrics.returns += 1;
      previous = number;
      const monday = number - ((weekday + 6) % 7);
      weeks.set(monday, (weeks.get(monday) || 0) + 1);
      const monthNumber = year * 12 + month;
      months.set(monthNumber, (months.get(monthNumber) || 0) + 1);
      if (!firstDayByWeek.has(monday)) firstDayByWeek.set(monday, day);
      if (!firstDayByMonth.has(monthNumber)) firstDayByMonth.set(monthNumber, day);
      const dayCharacters = characters[day] || 0;
      const previousWeekCharacters = weekCharacters.get(monday) || 0;
      const previousMonthCharacters = monthCharacters.get(monthNumber) || 0;
      weekCharacters.set(monday, previousWeekCharacters + dayCharacters);
      monthCharacters.set(monthNumber, previousMonthCharacters + dayCharacters);
      if (previousWeekCharacters < 5000 && previousWeekCharacters + dayCharacters >= 5000) {
        weeklyWordsAchievedAt.set(monday, day);
      }
      if (previousMonthCharacters < 20000 && previousMonthCharacters + dayCharacters >= 20000) {
        monthlyWordsAchievedAt.set(monthNumber, day);
      }
      yearCharacters.set(year, (yearCharacters.get(year) || 0) + dayCharacters);
      characterRuns.forEach(function (item) {
        item.run = dayCharacters >= item.minimum ? (consecutive ? item.run + 1 : 1) : 0;
        metrics[item.metric] = Math.max(metrics[item.metric], item.run);
      });
      if (dayCharacters >= 1000) metrics.thousandCharacterDays += 1;
      if (!seasons.has(year)) seasons.set(year, new Set());
      // Northern-hemisphere calendar seasons: Mar–May / Jun–Aug / Sep–Nov / Dec–Feb.
      seasons.get(year).add(Math.floor(((month + 10) % 12) / 3));
      if (weekday === 0 && dates.has(dayKey(number - 1))) {
        metrics.weekendPairs += 1;
        metrics.bestWeekendCharacters = Math.max(metrics.bestWeekendCharacters,
          dayCharacters + (characters[dayKey(number - 1)] || 0));
      }
      if (day.endsWith("-01-01") && dates.has(dayKey(number - 1))) metrics.newYearPairs += 1;
      if (day.endsWith("-02-29")) metrics.leapDays += 1;
      if ((characters[day] || 0) > metrics.bestDayCharacters) {
        metrics.bestDayCharacters = characters[day];
        metrics.bestDay = day;
      }
    });
    // Give the current journal day time to finish: yesterday's streak stays alive.
    if (previous !== null && todayNumber - previous <= 1) metrics.currentStreak = run;
    weeks.forEach(n => { if (n === 7) metrics.perfectWeeks += 1; });
    let monthRun = 0;
    let monthWordRun = 0;
    let previousMonth = null;
    months.forEach(function (n, monthNumber) {
      const year = Math.floor(monthNumber / 12);
      const month = monthNumber % 12;
      const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      if (n === daysInMonth) metrics.perfectMonths += 1;
      monthRun = previousMonth !== null && monthNumber - previousMonth === 1 ? monthRun + 1 : 1;
      metrics.consecutiveMonths = Math.max(metrics.consecutiveMonths, monthRun);
      monthWordRun = (monthCharacters.get(monthNumber) || 0) >= 10000
        ? (previousMonth !== null && monthNumber - previousMonth === 1 ? monthWordRun + 1 : 1) : 0;
      metrics.tenThousandCharacterMonths = Math.max(metrics.tenThousandCharacterMonths, monthWordRun);
      if ((monthCharacters.get(monthNumber) || 0) > metrics.bestMonthCharacters) {
        metrics.bestMonthCharacters = monthCharacters.get(monthNumber);
        metrics.bestMonth = year + "-" + String(month + 1).padStart(2, "0");
      }
      previousMonth = monthNumber;
    });
    weekCharacters.forEach(function (value, monday) {
      if (value > metrics.bestWeekCharacters) {
        metrics.bestWeekCharacters = value;
        metrics.bestWeek = dayKey(monday);
      }
    });
    yearCharacters.forEach(function (value, year) {
      if (value > metrics.bestYearCharacters) { metrics.bestYearCharacters = value; metrics.bestYear = String(year); }
    });
    seasons.forEach(value => { metrics.seasons = Math.max(metrics.seasons, value.size); });
    const datesComplete = Boolean(current.userJournalByDate)
      && (!count(historical.characters) || Boolean(historical.charactersByDate));
    const dailyComplete = datesComplete && Boolean(current.userJournalCharactersByDate)
      && (!count(historical.characters) || Boolean(historical.charactersByDate));
    const currentMonday = todayNumber - ((new Date(todayNumber * DAY).getUTCDay() + 6) % 7);
    const currentMonthNumber = Number(today.slice(0, 4)) * 12 + Number(today.slice(5, 7)) - 1;
    const monthLabel = n => Math.floor(n / 12) + "-" + String(n % 12 + 1).padStart(2, "0");
    const runs = {
      daily: streaks(days.map(dayNumber), todayNumber, 1, dayKey),
      thousand: streaks(days.filter(day => characters[day] >= 1000).map(dayNumber), todayNumber, 1, dayKey),
      weekly: streaks(Array.from(weeks.keys()), currentMonday, 7, dayKey),
      monthly: streaks(Array.from(months.keys()), currentMonthNumber, 1, monthLabel),
      weeklyWords: streaks(Array.from(weekCharacters.keys()).filter(n => weekCharacters.get(n) >= 5000),
        currentMonday, 7, dayKey),
      monthlyWords: streaks(Array.from(monthCharacters.keys()).filter(n => monthCharacters.get(n) >= 20000),
        currentMonthNumber, 1, monthLabel)
    };
    metrics.consecutiveWeeks = runs.weekly.longest;
    metrics.fiveThousandCharacterWeeks = runs.weeklyWords.longest;
    metrics.twentyThousandCharacterMonths = runs.monthlyWords.longest;
    const calendar = buildCalendar(days, today);
    calendar.levels.forEach(level => { metrics["calendarCoverage" + level.years] = level.covered; });
    const streakAchievementSources = {
      daily: { values: days.map(dayNumber), step: 1, label: dayKey },
      thousand: { values: days.filter(day => characters[day] >= 1000).map(dayNumber), step: 1, label: dayKey },
      weekly: { values: Array.from(weeks.keys()), step: 7, label: dayKey, achievedByPeriod: firstDayByWeek },
      monthly: { values: Array.from(months.keys()), step: 1, label: monthLabel, achievedByPeriod: firstDayByMonth },
      weeklyWords: { values: Array.from(weekCharacters.keys()).filter(n => weekCharacters.get(n) >= 5000),
        step: 7, label: dayKey, achievedByPeriod: weeklyWordsAchievedAt },
      monthlyWords: { values: Array.from(monthCharacters.keys()).filter(n => monthCharacters.get(n) >= 20000),
        step: 1, label: monthLabel, achievedByPeriod: monthlyWordsAchievedAt }
    };
    const badges = BADGES.map(function (badge) {
      const value = metrics[badge.metric];
      const run = runs[badge.streakKey];
      const progressValue = run ? run.current : value;
      const complete = badge.metric === "totalCharacters" || (badge.requiresDailyCharacters ? dailyComplete : datesComplete);
      let achievedAt = "";
      const source = streakAchievementSources[badge.streakKey];
      if (source && value >= badge.target) {
        achievedAt = firstStreakAchievement(source.values, badge.target, source.step, source.label,
          source.achievedByPeriod);
      } else if (badge.metric === "totalDays" && value >= badge.target) {
        achievedAt = days[badge.target - 1] || "";
      } else if (badge.metric === "thousandCharacterDays" && value >= badge.target) {
        achievedAt = days.filter(day => characters[day] >= 1000)[badge.target - 1] || "";
      } else if (badge.metric === "totalCharacters" && value >= badge.target) {
        achievedAt = cumulativeAchievement(days, badge.target, day => characters[day] || 0);
      } else if (badge.group === "calendar" && value >= badge.target) {
        const years = Number(badge.metric.slice("calendarCoverage".length));
        achievedAt = (calendar.levels.find(level => level.years === years) || {}).achievedAt || "";
      }
      return Object.assign({}, badge, { value: value, progressValue: progressValue, unlocked: value >= badge.target,
        achievedAt: achievedAt,
        progress: Math.min(1, progressValue / badge.target), streak: run || null,
        pending: !complete && value < badge.target });
    });
    const currentMonth = today.slice(0, 7);
    const currentMonthlyCharacters = monthCharacters.get(currentMonthNumber) || 0;
    const monthly = { month: currentMonth, characters: currentMonthlyCharacters,
      days: months.get(currentMonthNumber) || 0 };
    const yearDays = {};
    days.forEach(day => { yearDays[day.slice(0, 4)] = (yearDays[day.slice(0, 4)] || 0) + 1; });
    const fullYears = Object.keys(yearDays).filter(function (year) {
      return yearDays[year] === (Date.UTC(Number(year) + 1, 0, 1) - Date.UTC(Number(year), 0, 1)) / DAY;
    });
    // Only records with a separate past run/period are comparable personal bests.
    // Lifetime totals keep their existing fixed badge milestones instead.
    const personalRecords = [
      ["daily", "连续记录", "天", datesComplete],
      ["weekly", "连续每周有记", "周", datesComplete],
      ["monthly", "连续每月有记", "个月", datesComplete],
      ["thousand", "连续每日千字", "天", dailyComplete],
      ["weeklyWords", "连续每周五千字", "周", dailyComplete],
      ["monthlyWords", "连续每月两万字", "个月", dailyComplete]
    ].map(function (entry) {
      const run = runs[entry[0]];
      return { id: "streak-" + entry[0], name: entry[1], unit: entry[2], complete: entry[3],
        streakKey: entry[0], period: run.currentRange ? run.currentRange.start : "",
        value: run.current, best: run.longest, previousBest: run.previousBest };
    });
    [
      ["day", "单日字数纪录", new Map(Object.entries(characters)), today],
      ["week", "单周字数纪录", weekCharacters, currentMonday],
      ["month", "单月字数纪录", monthCharacters, currentMonthNumber],
      ["year", "单年字数纪录", yearCharacters, Number(today.slice(0, 4))]
    ].forEach(function (entry) {
      const value = entry[2].get(entry[3]) || 0;
      let previousBest = 0;
      entry[2].forEach(function (amount, period) {
        if (period !== entry[3]) previousBest = Math.max(previousBest, amount);
      });
      personalRecords.push({ id: "characters-" + entry[0], name: entry[1], unit: "字",
        complete: dailyComplete, period: String(entry[3]), value: value,
        best: Math.max(value, previousBest), previousBest: previousBest,
        nextMilestone: WRITING_MILESTONES[entry[0]].find(target => target > value) || 0 });
    });
    return { today: today, currentDays: currentDays.length,
      metrics: metrics, badges: badges, groups: GROUPS, streaks: runs, calendar: calendar,
      personalRecords: personalRecords,
      monthly: monthly, todayCharacters: characters[today] || 0,
      weeklyCharacters: weekCharacters.get(currentMonday) || 0,
      yearlyCharacters: yearCharacters.get(Number(today.slice(0, 4))) || 0,
      fullYears: fullYears, datesComplete: datesComplete,
      unlocked: badges.filter(b => b.unlocked).length, dailyComplete: dailyComplete,
      historicalDaysAvailable: Boolean(historical.charactersByDate),
      hasHistorical: count(historical.characters) > 0, wroteToday: dates.has(today) };
  }

  function newlyUnlocked(before, after) {
    if (!before || !after) return [];
    const existing = new Set(before.badges.filter(badge => badge.unlocked).map(badge => badge.id));
    return after.badges.filter(badge => badge.unlocked && !existing.has(badge.id));
  }

  function newlyBrokenRecords(before, after) {
    if (!before || !after) return [];
    return (after.personalRecords || []).filter(function (record) {
      const previous = (before.personalRecords || []).find(item => item.id === record.id);
      return previous && previous.complete && record.complete && record.previousBest > 0
        // Continuing to extend an already leading run/period is not another breakthrough.
        && previous.value <= previous.previousBest
        && record.value > previous.value
        && record.value > Math.max(previous.best, record.previousBest);
    }).map(function (record) {
      const previous = before.personalRecords.find(item => item.id === record.id);
      return Object.assign({}, record, { previousBest: Math.max(previous.best, record.previousBest) });
    });
  }

  function newlyReachedWritingMilestones(before, after) {
    if (!before || !after) return [];
    return (after.personalRecords || []).filter(record => record.id.startsWith("characters-"))
      .flatMap(function (record) {
        const previous = (before.personalRecords || []).find(item => item.id === record.id);
        if (!previous || !previous.complete || !record.complete || previous.period !== record.period
          || record.value <= previous.value) return [];
        const periodType = record.id.slice("characters-".length);
        return (WRITING_MILESTONES[periodType] || [])
          .filter(target => previous.value < target && record.value >= target)
          .map(target => ({ id: record.id, name: record.name, unit: record.unit,
            period: record.period, value: record.value, target: target }));
      });
  }

  return { compute: compute, journalDay: journalDay, validDay: validDay, newlyUnlocked: newlyUnlocked,
    newlyBrokenRecords: newlyBrokenRecords, newlyReachedWritingMilestones: newlyReachedWritingMilestones,
    medalSvg: medalSvg, newestFirst: newestFirst };
}));
