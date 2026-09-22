(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.MinimalNotesAchievements = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DAY = 86400000;
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
    n => "连续 " + n + " 天，每日都有记录", "天", false, "daily");
  add("weekly", "consecutiveWeeks", [52, 104, 156, 208],
    ["一载相见", "两载相见", "三载相见", "四载相见"],
    n => "连续 " + n + " 个自然周，每周至少写一次", "周", false, "weekly");
  add("monthly", "consecutiveMonths", [12, 24, 36, 48],
    ["一年相伴", "两年相伴", "三年相伴", "四年相伴"],
    n => "连续 " + n + " 个月，每月至少写一次", "个月", false, "monthly");
  add("rhythm", "thousandCharacterStreak", [14, 30, 60, 100],
    ["两周千言", "满月千言", "双月千言", "百日千言"],
    n => "连续 " + n + " 天，每日不少于 1000 字", "天", true, "thousand");
  add("weekly-words", "fiveThousandCharacterWeeks", [26, 52, 104, 156],
    ["半载成章", "一载成章", "两载成章", "三载成章"],
    n => "连续 " + n + " 个自然周，每周不少于 5000 字", "周", true, "weeklyWords");
  add("serial", "twentyThousandCharacterMonths", [12, 24, 36, 48],
    ["一年长卷", "两年长卷", "三年长卷", "四年长卷"],
    n => "连续 " + n + " 个月，每月不少于 2 万字", "个月", true, "monthlyWords");
  add("thousand", "thousandCharacterDays", [500, 1000, 1500, 2000],
    ["千言成习", "千言成卷", "千言成林", "千言成河"],
    n => "累计 " + n + " 天，每日不少于 1000 字，可不连续", "天", true);
  add("days", "totalDays", [1000, 1500, 2000, 2500],
    ["日久成习", "日久成册", "日久成卷", "日久成史"],
    n => "累计记录 " + n + " 个不同的日子", "天");
  add("words", "totalCharacters", [1000000, 2000000, 3000000, 4000000],
    ["百万字长卷", "两百万字长卷", "三百万字长卷", "四百万字长卷"],
    n => "累计写下 " + (n / 10000) + " 万字", "字");
  [1, 2, 3, 4].forEach(function (years) {
    add("calendar", "calendarCoverage" + years, [365],
      [years === 1 ? "岁时初圆" : years === 2 ? "岁时重逢"
        : years === 3 ? "岁时三叠" : "岁时四叠"],
      () => "365 个日期，每个都在至少 " + years + " 个年份留下记录", "个日期");
  });

  // Shared motifs make day/week/month and writing/accumulation relationships visible.
  // Tier belongs to a series, including calendar badges created in separate add() calls.
  function medalSvg(groupId, tier) {
    const group = GROUPS.find(item => item.id === groupId) || GROUPS[0];
    const level = Math.max(1, Math.min(4, Math.trunc(Number(tier)) || 1));
    const calendar = '<rect x="3" y="5" width="28" height="27" rx="4"/>'
      + '<path d="M10 2v6m14-6v6M3 12h28"/>';
    const dots = (xs, ys) => ys.map(y => xs.map(x =>
      '<circle cx="' + x + '" cy="' + y + '" r="1.25" fill="currentColor" stroke="none"/>'
    ).join("")).join("");
    const motifs = {
      day: calendar + '<circle cx="17" cy="22" r="3.5" fill="currentColor" stroke="none"/>',
      week: calendar + '<rect x="5" y="18" width="24" height="8" rx="1.5"/>'
        + '<path d="M8.5 18v8M12 18v8M15.5 18v8M19 18v8M22.5 18v8M26 18v8" stroke-width="1"/>',
      month: calendar + dots([9, 17, 25], [18, 23, 28]),
      stack: '<path d="M9 2h19a3 3 0 0 1 3 3v20M5 6h19a3 3 0 0 1 3 3v20"/>'
        + '<rect x="1" y="10" width="22" height="22" rx="3"/>'
        + '<path d="M1 16h22"/><circle cx="12" cy="24" r="3" fill="currentColor" stroke="none"/>',
      scroll: '<path d="M7 4h21a4 4 0 0 1 4 4v3h-7V8a4 4 0 0 1 3-4M7 4a4 4 0 0 0-4 4v18'
        + 'M25 10v17a5 5 0 0 1-5 5H7a4 4 0 0 1-4-4v-2h13v2a4 4 0 0 0 4 4"/>'
        + '<path d="M9 12h10M9 17h10M9 22h6"/>',
      year: '<circle cx="17" cy="17" r="15" stroke-dasharray=".1 7.75" stroke-width="2.4"/>'
        + '<path d="M17 2a15 15 0 0 1 15 15M28 14l4 3 2-4"/>'
        + '<rect x="9" y="10" width="16" height="15" rx="2"/>'
        + '<path d="M13 8v4m8-4v4M9 15h16m-11 5 2 2 4-4"/>'
    };
    const nib = '<path d="m32 17-10 4-3 12 12-3 4-10Z" fill="var(--medal-paper)" stroke="var(--medal-paper)" stroke-width="5"/>'
      + '<path d="m32 17-10 4-3 12 12-3 4-10Z" fill="var(--medal-paper)"/>'
      + '<path d="m19 33 8-8m-5-4 9 9"/><circle cx="27" cy="25" r="1.6" fill="var(--medal-paper)"/>';
    const grades = [0, 1, 2, 3].map(function (index) {
      const x = 29.5 + index * 7;
      return '<path d="m' + x + ' 56 2.4 3-2.4 3-2.4-3Z" fill="'
        + (index < level ? 'currentColor' : 'var(--medal-paper)')
        + '" stroke="currentColor" stroke-width=".8"/>';
    }).join("");
    return '<svg class="achievement-medal" viewBox="0 0 80 92" aria-hidden="true" focusable="false">'
      + '<g stroke="currentColor" stroke-linejoin="round">'
      + '<path d="m23 56-8 29 14-5 8 7 6-28m14-3 8 29-14-5-8 7-6-28" fill="var(--medal-fill)" stroke-width="1.3"/>'
      + '<path d="m25 65-4 13m34-13 4 13" fill="none" stroke-width="1" opacity=".45"/>'
      + '<circle cx="40" cy="37" r="33" fill="var(--medal-fill)" stroke-width="1.4"/>'
      + '<circle cx="40" cy="37" r="28" fill="var(--medal-paper)" stroke-width=".7"/>'
      + '</g><g transform="translate(23 17)" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'
      + motifs[group.icon] + (group.writing ? nib : '') + '</g>' + grades + '</svg>';
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
    newlyBrokenRecords: newlyBrokenRecords, medalSvg: medalSvg, newestFirst: newestFirst };
}));
