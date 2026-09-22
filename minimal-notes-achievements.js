(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.MinimalNotesAchievements = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DAY = 86400000;
  const GROUPS = [
    { id: "streak", title: "坚持与日历", icon: "flame" },
    { id: "rhythm", title: "每天有话说", icon: "pen" },
    { id: "serial", title: "周刊、月刊与连载", icon: "book" },
    { id: "days", title: "日子收藏家", icon: "book" },
    { id: "words", title: "字里行间", icon: "pen" },
    { id: "moments", title: "时间的小彩蛋", icon: "spark" }
  ];
  const BADGES = [];
  function add(group, metric, targets, names, rule, unit, requiresDailyCharacters) {
    targets.forEach(function (target, index) {
      BADGES.push({ id: metric + "-" + target, group: group, metric: metric, target: target,
        name: names[index], rule: rule(target), unit: unit,
        requiresDailyCharacters: Boolean(requiresDailyCharacters) });
    });
  }
  add("streak", "longestStreak", [7, 30, 100, 200, 365],
    ["一周同行", "三十日长信", "百日如一", "两百日的约定", "一整年的陪伴"],
    n => "曾连续 " + n + " 天写日记", "天");
  add("streak", "perfectWeeks", [1], ["完美的一周"],
    n => "累计 " + n + " 个完整周，周一至周日每天都有记录", "周");
  add("streak", "perfectMonths", [1, 12], ["完美的一个月", "十二个月的圆满"],
    n => "累计 " + n + " 个完整自然月，每天都有记录", "月");
  add("days", "totalDays", [365, 1000], ["日子成册", "千日留痕"],
    n => "累计记录 " + n + " 个不同的日子", "天");
  add("words", "totalCharacters", [500000, 1000000, 2000000], ["半部人生书", "百万字长卷", "双百万字"],
    n => "累计写下 " + (n / 10000) + " 万字", "字");
  add("words", "bestDayCharacters", [1000, 7500], ["千字一日", "七千五百字的长谈"],
    n => "同一个日记日累计写下 " + n.toLocaleString("zh-CN") + " 字", "字", true);
  add("moments", "seasons", [4], ["四季来信"], () => "同一年里，春夏秋冬都留下记录", "季");
  add("moments", "consecutiveMonths", [24], ["两年月月见"], n => "连续 " + n + " 个月，每个月都来写过", "月");
  add("moments", "newYearPairs", [1], ["跨年信笺"],
    n => "累计 " + n + " 次，相邻的 12 月 31 日和 1 月 1 日都有记录", "次");
  add("moments", "returns", [1], ["重新落笔"], () => "空白至少 7 天之后，再次写下日记", "次");
  add("moments", "leapDays", [1], ["四年一遇"], () => "在 2 月 29 日留下记录", "次");
  add("rhythm", "hundredCharacterStreak", [30], ["微光连载"],
    n => "连续 " + n + " 天，每天至少 100 字", "天", true);
  add("rhythm", "threeHundredCharacterStreak", [100, 365], ["百日有声", "每日成章"],
    n => "连续 " + n + " 天，每天至少 300 字", "天", true);
  add("rhythm", "thousandCharacterStreak", [7, 14, 30], ["七日千言", "半月千言", "三十日千言"],
    n => "连续 " + n + " 天，每天至少 1000 字", "天", true);
  add("serial", "bestWeekCharacters", [10000, 20000, 30000], ["万字周刊", "两万字特刊", "三万字特刊"],
    n => "同一个自然周，周一至周日累计至少 " + n.toLocaleString("zh-CN") + " 字", "字", true);
  add("serial", "bestMonthCharacters", [30000, 60000, 100000], ["三万字月刊", "六万字月刊", "十万字合订本"],
    n => "同一个自然月累计至少 " + n.toLocaleString("zh-CN") + " 字", "字", true);
  add("serial", "tenThousandCharacterMonths", [12], ["十二月连载"],
    n => "连续 " + n + " 个月，每月累计至少 1 万字", "月", true);
  add("moments", "bestWeekendCharacters", [3000], ["周末特刊"],
    () => "同一个周末两天都有记录，周六和周日合计至少 3000 字", "字", true);
  add("words", "thousandCharacterDays", [100], ["百日千言"],
    n => "累计 " + n + " 天，每天写下至少 1000 字，不要求连续", "天", true);
  add("words", "bestYearCharacters", [300000], ["三十万字年鉴"],
    n => "同一个自然年累计至少 " + (n / 10000) + " 万字", "字", true);

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

  function compute(current, historical, now) {
    current = current || {};
    historical = historical || {};
    const today = journalDay(now);
    const todayNumber = dayNumber(today);
    // Manifest keys are already journal days; never shift these a second time.
    const dates = new Set();
    const characters = {};
    const historicalDays = historical.charactersByDate || {};
    [current.userJournalByDate || {}, historicalDays].forEach(function (map) {
      Object.keys(map).forEach(function (day) {
        if (validDay(day) && day <= today && count(map[day])) dates.add(day);
      });
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
      thousandCharacterDays: 0, bestWeekCharacters: 0, bestWeek: "", bestMonthCharacters: 0,
      bestMonth: "", tenThousandCharacterMonths: 0, bestWeekendCharacters: 0, bestYearCharacters: 0 };
    const weeks = new Map();
    const months = new Map();
    const seasons = new Map();
    const weekCharacters = new Map();
    const monthCharacters = new Map();
    const yearCharacters = new Map();
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
      const dayCharacters = characters[day] || 0;
      weekCharacters.set(monday, (weekCharacters.get(monday) || 0) + dayCharacters);
      monthCharacters.set(monthNumber, (monthCharacters.get(monthNumber) || 0) + dayCharacters);
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
    yearCharacters.forEach(value => { metrics.bestYearCharacters = Math.max(metrics.bestYearCharacters, value); });
    seasons.forEach(value => { metrics.seasons = Math.max(metrics.seasons, value.size); });
    const dailyComplete = Boolean(current.userJournalCharactersByDate)
      && (!count(historical.characters) || Boolean(historical.charactersByDate));
    const badges = BADGES.map(function (badge) {
      const value = metrics[badge.metric];
      return Object.assign({}, badge, { value: value, unlocked: value >= badge.target,
        progress: Math.min(1, value / badge.target),
        pending: badge.requiresDailyCharacters && !dailyComplete && value < badge.target });
    });
    const currentMonth = today.slice(0, 7);
    const currentMonthNumber = Number(today.slice(0, 4)) * 12 + Number(today.slice(5, 7)) - 1;
    const currentMonthlyCharacters = monthCharacters.get(currentMonthNumber) || 0;
    const monthly = { month: currentMonth, characters: currentMonthlyCharacters,
      days: months.get(currentMonthNumber) || 0 };
    return { today: today, metrics: metrics, badges: badges, groups: GROUPS,
      monthly: monthly,
      unlocked: badges.filter(b => b.unlocked).length, dailyComplete: dailyComplete,
      historicalDaysAvailable: Boolean(historical.charactersByDate),
      hasHistorical: count(historical.characters) > 0, wroteToday: dates.has(today) };
  }

  function newlyUnlocked(before, after) {
    if (!before || !after) return [];
    const existing = new Set(before.badges.filter(badge => badge.unlocked).map(badge => badge.id));
    return after.badges.filter(badge => badge.unlocked && !existing.has(badge.id));
  }

  return { compute: compute, journalDay: journalDay, validDay: validDay, newlyUnlocked: newlyUnlocked };
}));
