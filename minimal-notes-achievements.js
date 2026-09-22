(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.MinimalNotesAchievements = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DAY = 86400000;
  const GROUPS = [
    { id: "streak", title: "每日长续", icon: "flame" },
    { id: "weekly", title: "周周有记", icon: "book" },
    { id: "monthly", title: "月月有记", icon: "book" },
    { id: "rhythm", title: "每日千字", icon: "pen" },
    { id: "weekly-words", title: "每周五千字", icon: "pen" },
    { id: "serial", title: "每月两万字", icon: "pen" },
    { id: "thousand", title: "千字积累", icon: "pen" },
    { id: "days", title: "日常积累", icon: "book" },
    { id: "words", title: "长卷", icon: "pen" },
    { id: "calendar", title: "日历收藏", icon: "spark" }
  ];
  const BADGES = [];
  function add(group, metric, targets, names, rule, unit, requiresDailyCharacters, streakKey) {
    targets.forEach(function (target, index) {
      BADGES.push({ id: metric + "-" + target, group: group, metric: metric, target: target,
        name: names[index], rule: rule(target), unit: unit,
        requiresDailyCharacters: Boolean(requiresDailyCharacters), streakKey: streakKey || "" });
    });
  }
  add("streak", "longestStreak", [200, 365, 730],
    ["两百日长续", "三百六十五日", "七百三十日"],
    n => "连续 " + n + " 天，每日都有记录", "天", false, "daily");
  add("weekly", "consecutiveWeeks", [52, 104, 156],
    ["五十二周", "一百零四周", "一百五十六周"],
    n => "连续 " + n + " 个自然周，每周至少写一次", "周", false, "weekly");
  add("monthly", "consecutiveMonths", [18, 24, 36, 60],
    ["十八个月", "两年月月见", "三年月月见", "五年月月见"],
    n => "连续 " + n + " 个月，每月至少写一次", "个月", false, "monthly");
  add("rhythm", "thousandCharacterStreak", [14, 30, 60, 100],
    ["十四日千言", "三十日千言", "六十日千言", "百日千言"],
    n => "连续 " + n + " 天，每日不少于 1000 字", "天", true, "thousand");
  add("weekly-words", "fiveThousandCharacterWeeks", [26, 52, 104],
    ["二十六周五千字", "五十二周五千字", "一百零四周五千字"],
    n => "连续 " + n + " 个自然周，每周不少于 5000 字", "周", true, "weeklyWords");
  add("serial", "twentyThousandCharacterMonths", [12, 24, 36],
    ["十二月长篇", "二十四月长篇", "三十六月长篇"],
    n => "连续 " + n + " 个月，每月不少于 2 万字", "个月", true, "monthlyWords");
  add("thousand", "thousandCharacterDays", [500, 1000, 2000],
    ["五百日千言", "千日千言", "两千日千言"],
    n => "累计 " + n + " 天，每日不少于 1000 字，可不连续", "天", true);
  add("days", "totalDays", [1000, 1500, 2000, 3000],
    ["千日留痕", "一千五百日", "两千日留痕", "三千日留痕"],
    n => "累计记录 " + n + " 个不同的日子", "天");
  add("words", "totalCharacters", [1000000, 2000000, 3000000, 5000000],
    ["百万字长卷", "两百万字", "三百万字", "五百万字"],
    n => "累计写下 " + (n / 10000) + " 万字", "字");
  [1, 2, 3].forEach(function (years) {
    add("calendar", "calendarCoverage" + years, [365],
      [years === 1 ? "日历全收藏" : years === 2 ? "日历再相逢" : "日历三重奏"],
      () => "365 个日期，每个都在至少 " + years + " 个年份留下记录", "个日期");
  });

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
      levels: [1, 2, 3].map(function (years) {
        return { years: years, covered: dates.filter(day => day.count >= years).length,
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
    const badges = BADGES.map(function (badge) {
      const value = metrics[badge.metric];
      const run = runs[badge.streakKey];
      const progressValue = run ? run.current : value;
      const complete = badge.metric === "totalCharacters" || (badge.requiresDailyCharacters ? dailyComplete : datesComplete);
      return Object.assign({}, badge, { value: value, progressValue: progressValue, unlocked: value >= badge.target,
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
        best: Math.max(value, previousBest), previousBest: previousBest });
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

  return { compute: compute, journalDay: journalDay, validDay: validDay, newlyUnlocked: newlyUnlocked,
    newlyBrokenRecords: newlyBrokenRecords };
}));
