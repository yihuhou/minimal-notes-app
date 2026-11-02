# solarlunar 3.1.0

Unmodified browser UMD distribution from the official `solarlunar` npm package.
Copyright (c) 2015, yize. ISC license: `solarlunar-LICENSE`.

- Upstream: https://github.com/yize/solarlunar
- Version: 3.1.0; npm gitHead: `ff4da699128b53af8db5702322b1e8e7fa6cf19a`
- Original: `package/dist/solarlunar.min.js`
- Package: https://registry.npmjs.org/solarlunar/-/solarlunar-3.1.0.tgz
- Package SHA512 integrity: `sha512-PCJsIeSaMyQVK6TZk+tlPNaoAlk02+2UxhI/DS+K0zdLkwTihMp4px6S+Jv6HPPC0p7QsUM18WSs2/HEC1o0wQ==`
- Retrieved: 2026-11-02. No runtime CDN request or package installation required.

Birthday conversion uses only `solar2lunar`, selecting Gregorian fields in
Asia/Shanghai before conversion. Supported years: 1900–2100; invalid or
unsupported results fail closed. Ordinary and leap lunar months stay distinct.
Do not substitute native `Intl` Chinese-calendar conversion: it disagreed with
the official 2027 New Year date in the tested ICU runtime.

Verified every date in 2025–2030 (2,191 dates, zero differences) against the Hong
Kong Observatory's official Gregorian–Lunar Calendar Conversion Tables:
https://www.hko.gov.hk/en/gts/time/calendar/text/files/T2025e.txt
through `T2030e.txt` (2024 year-end used to establish the first lunar month).
These are generic calendar facts, not personal birthday data. Focused boundary
samples remain in `tools/birthday-reminders-regression-check.js`.
