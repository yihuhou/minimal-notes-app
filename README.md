# Minimal Notes / 极简记录

打开这个链接就可以直接使用：

[https://yihuhou.github.io/minimal-notes-app/](https://yihuhou.github.io/minimal-notes-app/)

不需要下载，不需要安装，也不需要会写代码。

Open this link to use the app directly:

[https://yihuhou.github.io/minimal-notes-app/](https://yihuhou.github.io/minimal-notes-app/)

No download, installation, or coding required.

---

## 中文说明

### 这是什么

极简记录是一个在线个人记录工具，可以用来写：

- 待办
- 日程
- 截止事项
- 临时想法
- 日记

打开网页后，直接在输入框里写内容，按 `Enter` 保存。

示例：

```text
明天 10 点开会
DDL 6月10日前交材料
想法：以后做一个手机端快捷入口
日记：今天把论文引言改完了
```

### 分类和筛选

输入框下方有 `事项`、`待办`、`日程`、`截止`、`想法`、`日记`、`已完成` 这些筛选按钮。

`待办`、`日程`、`截止` 可以自动识别：普通内容默认是待办；带时间的内容通常会识别为日程；带 `DDL`、`截止`、`前`、`之前` 等截止提示的内容会识别为截止事项。`想法` 和 `日记` 不会自动猜测，需要在内容开头写 `想法：`、`日记：`，或者先点到对应筛选按钮再输入。

如果你先点到某个具体类别，再直接输入内容，新的记录会默认保存到这个类别里。例如：

- 点 `日记` 后输入 `今天把论文引言改完了`，会直接保存为日记，不需要每次都写 `日记：`。
- 点 `想法` 后输入内容，会保存为想法。
- 点 `日程`、`截止` 或 `待办` 后输入内容，会保存到对应事项类别。

如果使用类型下拉框，或者在内容开头写 `日记：`、`想法：`、`DDL` 等明确提示，应用会优先按这些明确提示处理。`事项` 和 `已完成` 只是查看范围，不会把新记录固定到某个类别。

### 循环事项

应用支持循环待办、日程和截止事项。可以直接写自然语言，例如：

```text
每天 9 点吃药
每个工作日 10 点站会
每周一、三跑步
每月 15 号交报告
每月底整理账单
每 3 天浇花
每两周一次检查设备
```

基本逻辑：

- 识别到 `每天`、`每周一`、`每月 15 号`、`每 3 天` 等循环表达后，记录会带上循环标签。
- 标记完成后，应用不会把这条记录彻底归档，而是记录本次完成，并把它推进到下一次。
- 固定日期类循环，例如 `每周一`、`每月 15 号`、`每月底`，会跳到下一个符合日历规则的日期。
- 间隔类循环，例如 `每 3 天`、`每两周一次`，会从你完成的时间开始计算下一次。
- 日记和想法不参与循环；它们更适合当作普通记录保存。

### 数据默认保存在哪里

如果你什么都不设置，记录会保存在当前浏览器里。

这适合临时使用，但有几个限制：

- 换手机或换电脑后，看不到原来的记录。
- 换浏览器后，也看不到原来的记录。
- 如果清理浏览器数据，记录可能会丢失。

如果你想在不同设备之间同步，推荐设置 GitHub 同步。电脑端也可以用云盘同步文件作为备选方案。

### GitHub 同步需要准备什么

你只需要准备两样东西：

1. 一个自己的 GitHub 仓库，用来保存记录数据。
2. 一个自己的 GitHub Token，用来允许网页写入这个仓库。

建议新建一个私有仓库，例如：

```text
minimal-notes-data
```

不要把私人记录放在公开仓库里。你不需要提前创建 `minimal-notes-records.json`，应用会在第一次同步时自动创建和更新这个文件。

### Token 是什么

Token 可以理解为一把钥匙。

这个网页不会、也不应该知道你的 GitHub 密码。所以你需要创建一个 Token，让网页可以帮你把记录保存到你自己的 GitHub 仓库里。

注意：

- 不要把 Token 发给别人。
- 不要把 Token 发到网上。
- Token 泄露后，别人可能能改你的同步文件。
- 如果 Token 泄露，去 GitHub 设置里删掉它，再重新创建一个。

### 创建 GitHub Token

推荐创建 fine-grained personal access token。

1. 打开 [GitHub Token 设置页面](https://github.com/settings/personal-access-tokens)。
2. 点击 `Generate new token`。
3. 名字可以填 `Minimal Notes Sync`。
4. `Repository access` 选择 `Only select repositories`。
5. 选择你刚刚创建的记录仓库，例如 `minimal-notes-data`。
6. 在 `Repository permissions` 里找到 `Contents`。
7. 把 `Contents` 设置为 `Read and write`。
8. 生成 Token，并复制它。

Token 生成后通常只显示一次，请马上复制保存。

### 在网页里开启 GitHub 同步

打开：

[https://yihuhou.github.io/minimal-notes-app/](https://yihuhou.github.io/minimal-notes-app/)

然后：

1. 点击输入框下方的 `...`。
2. 点击 `GitHub 同步`。
3. 填写：

| 字段 | 填什么 |
| --- | --- |
| GitHub 仓库 | `你的用户名/仓库名`，例如 `alice/minimal-notes-data` |
| GitHub 分支 | 一般填 `main` |
| 数据文件路径 | 一般填 `minimal-notes-records.json` |
| GitHub Token | 粘贴刚刚创建的 Token |

4. 点击 `保存同步`。

之后你的记录会同步到自己的 GitHub 仓库。换手机、换电脑时，再打开同一个网页，填同一套 GitHub 同步信息即可。

如果是在临时设备上使用，可以点击 `临时同步`。它适合临时读取和写入，不会长期保存同步设置和 Token。

### 云盘同步这个备选项

如果你不想设置 GitHub Token，或者想在电脑上多留一份备份，可以使用云盘同步文件。

它的原理很简单：应用把记录写进一个 JSON 文件。你把这个文件放在 iCloud Drive、OneDrive、Dropbox、坚果云等会自动同步的文件夹里，云盘负责把这个文件同步到其他电脑。

使用方法：

1. 用电脑上的 Chrome 或 Edge 打开应用。
2. 点击输入框下方的 `...`。
3. 点击 `新建同步文件`，把文件保存到你的云盘文件夹里。
4. 另一台电脑打开同一个网页后，点击 `连接同步文件`，选择同一个 JSON 文件。

如果你已经开启 GitHub 同步，云盘按钮会变成 `新建备份`、`连接备份`。这时 GitHub 是主同步，云盘 JSON 只是额外备份。需要时可以点 `从备份恢复`。

注意：

- 云盘同步主要适合电脑端。
- 手机浏览器通常不支持这种文件同步方式。
- 浏览器重新打开后，可能会要求你重新授权文件访问，按提示点击 `授权同步` 或 `授权备份` 即可。
- 多台电脑同时编辑同一个云盘文件时，云盘软件可能生成冲突副本。多设备频繁使用时，更推荐 GitHub 同步。

### 导入和导出

点击输入框下方的 `...` 后可以使用：

- `导出 JSON`：下载当前记录备份。
- `导入 JSON`：用 JSON 文件覆盖当前本地数据。

导入会覆盖当前本地记录。操作前建议先导出一份备份。

### 可选扩展数据

普通记录不需要手写数据文件。下面这些文件只用于可选扩展功能。

这些 JSON 通常可以由你自己的数据接口、自动化脚本或 AI agent 生成。例如，健康小结和健康月历可以从手表、运动平台或个人健康数据导出后整理生成；日记高亮词表也可以由你信任的本地或私有流程辅助生成。普通用户不需要手写这些文件；不用对应扩展功能时，直接忽略即可。

如果你已经设置了 GitHub 同步，可以把这些文件放在同一个私有数据仓库里；应用会用同一个 Token 读取它们。如果你自己部署网页，也可以把这些 JSON 放在网页根目录。

| 模板 | 复制到你的数据仓库后改名为 | 用途 |
| --- | --- | --- |
| [`minimal-notes-health-summary.template.json`](minimal-notes-health-summary.template.json) | `minimal-notes-health-summary.json` | 可选健康小结、指标、建议和训练建议 |
| [`minimal-notes-health-calendar.template.json`](minimal-notes-health-calendar.template.json) | `minimal-notes-health-calendar.json` | 可选健康月历 |
| [`minimal-notes-journal-private-highlights.template.json`](minimal-notes-journal-private-highlights.template.json) | `minimal-notes-journal-private-highlights.json` | 可选日记私有高亮词表 |

说明：

- `minimal-notes-health-summary.json` 会显示顶部健康小结。
- `minimal-notes-health-calendar.json` 会显示本月健康月历。
- `minimal-notes-journal-private-highlights.json` 可以给日记高亮添加自己的地点别名、关键词组、正则规则，或隐藏误识别的词。

健康数据通常很敏感，建议只放在私有仓库里。

### 常见问题

**我需要 fork 或下载这个项目吗？**

不需要。普通用户直接打开上面的链接就能用。

**我一定要设置 GitHub 同步吗？**

不一定。只在一个浏览器里临时使用，可以不设置。想多设备同步，推荐设置 GitHub 同步；只在电脑之间同步，也可以用云盘同步文件。

**我需要自己创建 `minimal-notes-records.json` 吗？**

不需要。设置 GitHub 同步后，应用会自动创建和维护这个文件。

**我可以把数据文件放在这个公开仓库里吗？**

不建议。请单独创建私有数据仓库，公开仓库只用来托管应用代码和公开模板。

**Token 填错了怎么办？**

重新打开 `GitHub 同步`，填新的 Token，再点 `保存同步`。

**提示 401 或 Bad credentials**

Token 错了、过期了，或者已经被删除。重新创建 Token。

**提示 403**

Token 没有写入权限。检查 `Contents` 是否设置成 `Read and write`，并确认 Token 授权了正确的数据仓库。

**提示 404**

仓库名、分支名或文件路径可能填错了。仓库格式应该像这样：

```text
你的用户名/仓库名
```

**别人会看到我的记录吗？**

如果你的数据仓库是公开仓库，别人可能看到。建议使用私有仓库。

### 给开发者

这个项目是静态网页应用，主要文件是 `index.html`。如果你想自己改代码，可以下载仓库后直接编辑 `index.html`。GitHub Pages 发布时不需要后端服务。

---

## English

### What Is This

Minimal Notes is an online personal notes app for:

- todos
- meetings
- deadlines
- quick ideas
- journals

Use it here:

[https://yihuhou.github.io/minimal-notes-app/](https://yihuhou.github.io/minimal-notes-app/)

Type something into the input box and press `Enter` to save.

Examples:

```text
Meeting tomorrow at 10
DDL before June 10 submit materials
Idea: add a mobile shortcut
Journal: finished revising the introduction today
```

### Categories And Filters

The filter buttons under the input box include `事项` (Items), `待办` (Todo), `日程` (Schedule), `截止` (Deadline), `想法` (Idea), `日记` (Journal), and `已完成` (Completed).

`待办` (Todo), `日程` (Schedule), and `截止` (Deadline) can be detected automatically: plain text defaults to todo; text with a time is usually treated as a schedule item; text with deadline hints such as `DDL`, `截止`, `前`, or `之前` is treated as a deadline. `想法` (Idea) and `日记` (Journal) are not guessed automatically; use an `Idea:` / `Journal:` prefix, or click the matching filter before typing.

If you click a specific category first and then type into the input box, new records are saved to that category by default. For example:

- Click `日记` (`Journal`), type `finished revising the introduction today`, and press `Enter`; it is saved as a journal entry without typing `Journal:` every time.
- Click `想法` (`Idea`) to save new entries as ideas.
- Click `日程` (`Schedule`), `截止` (`Deadline`), or `待办` (`Todo`) to save new entries into that item category.

The type dropdown and explicit prefixes such as `Journal:`, `Idea:`, or `DDL` still take priority. `事项` (`Items`) and `已完成` (`Completed`) are viewing filters only and do not force a category for new records.

### Recurring Items

The app supports recurring todos, schedules, and deadlines. The natural-language parser is Chinese-first, with `daily` and `every day` also supported. Examples:

```text
每天 9 点吃药
每个工作日 10 点站会
每周一、三跑步
每月 15 号交报告
每月底整理账单
每 3 天浇花
每两周一次检查设备
```

Basic logic:

- When the app detects a recurrence phrase such as `每天`, `每周一`, `每月 15 号`, or `每 3 天`, the record gets a recurrence label.
- When you mark a recurring record as done, the app records that occurrence and moves the same item to the next occurrence instead of permanently archiving it.
- Fixed calendar rules, such as `每周一`, `每月 15 号`, and `每月底`, advance to the next matching calendar date.
- Interval rules, such as `每 3 天` or `每两周一次`, calculate the next occurrence from the time you complete the item.
- Journals and ideas do not recur; they are saved as normal passive records.

### Where Data Is Saved By Default

If you do not set up sync, records are saved in the current browser only.

That means:

- another phone or computer will not see the same records
- another browser will not see the same records
- clearing browser data may delete the records

To sync across devices, GitHub sync is recommended. On desktop browsers, a cloud-drive sync file can also be used as an alternative.

### What You Need For GitHub Sync

You need two things:

1. Your own GitHub repository for storing note data.
2. Your own GitHub Token so the web app can write to that repository.

A private repository is recommended, for example:

```text
minimal-notes-data
```

Do not store private notes in a public repository. You do not need to create `minimal-notes-records.json` ahead of time; the app creates and updates it during sync.

### What Is a Token

A Token is like a key.

This web app does not know your GitHub password and should never ask for it. Instead, you create a Token that allows the app to save records into your own GitHub repository.

Important:

- Do not share your Token.
- Do not post your Token online.
- If your Token leaks, someone may be able to change your sync file.
- If it leaks, delete it in GitHub settings and create a new one.

### Create a GitHub Token

A fine-grained personal access token is recommended.

1. Open [GitHub Token settings](https://github.com/settings/personal-access-tokens).
2. Click `Generate new token`.
3. Name it `Minimal Notes Sync`.
4. Set `Repository access` to `Only select repositories`.
5. Select your notes data repository, such as `minimal-notes-data`.
6. Under `Repository permissions`, find `Contents`.
7. Set `Contents` to `Read and write`.
8. Generate the Token and copy it.

GitHub usually shows the Token only once, so copy it immediately.

### Enable GitHub Sync In The App

Open:

[https://yihuhou.github.io/minimal-notes-app/](https://yihuhou.github.io/minimal-notes-app/)

Then:

1. Click `...` under the input box.
2. Click `GitHub 同步` (`GitHub Sync`).
3. Fill in:

| Field | Value |
| --- | --- |
| GitHub repository | `your-username/repository-name`, for example `alice/minimal-notes-data` |
| GitHub branch | Usually `main` |
| Data file path | Usually `minimal-notes-records.json` |
| GitHub Token | Paste the Token you created |

4. Click `保存同步` (`Save Sync`).

After that, records will sync to your own GitHub repository. On another phone or computer, open the same link and enter the same GitHub sync settings.

Use `临时同步` (`Temporary Sync`) on temporary devices. It can read and write temporarily without keeping sync settings or the token long term.

### Cloud Drive Sync As An Alternative

If you do not want to set up a GitHub Token, or if you want an extra desktop backup, you can use a cloud-drive sync file.

The idea is simple: the app writes records into one JSON file. Put that file in a folder synced by iCloud Drive, OneDrive, Dropbox, Nutstore, or another cloud-drive app. The cloud-drive app syncs the file to your other computers.

How to use it:

1. Open the app in Chrome or Edge on a computer.
2. Click `...` under the input box.
3. Click `新建同步文件` (`New sync file`) and save the file into your cloud-drive folder.
4. On another computer, open the same web page, click `连接同步文件` (`Connect sync file`), and choose the same JSON file.

If GitHub sync is already enabled, these buttons become `新建备份` (`New backup`) and `连接备份` (`Connect backup`). In that case, GitHub is the main sync method, and the cloud-drive JSON file is only an extra backup. You can use `从备份恢复` (`Restore from backup`) when needed.

Notes:

- Cloud-drive sync is mainly for desktop browsers.
- Mobile browsers usually do not support this file access method.
- After reopening the browser, you may need to grant file access again. Click `授权同步` (`Authorize sync`) or `授权备份` (`Authorize backup`) when prompted.
- If multiple computers edit the same cloud-drive file at the same time, your cloud-drive app may create conflict copies. For frequent multi-device use, GitHub sync is more reliable.

### Import And Export

Open `...` to use:

- `导出 JSON` (`Export JSON`): download a backup of current records.
- `导入 JSON` (`Import JSON`): replace current local data with a JSON file.

Import replaces current local records. Export a backup first if you need to keep the existing data.

### Optional Extension Data

Normal notes do not require hand-written data files. The files below are only for optional extension features.

These JSON files can usually be generated by your own data interface, automation script, or AI agent. For example, health summary and calendar data can be generated from smartwatch, fitness platform, or personal health exports; journal highlight rules can also be generated by a trusted local or private workflow. Normal users do not need to write these files by hand; ignore them if you do not use the corresponding extension features.

If GitHub sync is enabled, place these files in the same private data repository; the app reads them with the same Token. If you self-host the app, you can also place these JSON files at the web root.

| Template | Rename in your data repository | Purpose |
| --- | --- | --- |
| [`minimal-notes-health-summary.template.json`](minimal-notes-health-summary.template.json) | `minimal-notes-health-summary.json` | Optional health summary, metrics, advice, and training suggestion |
| [`minimal-notes-health-calendar.template.json`](minimal-notes-health-calendar.template.json) | `minimal-notes-health-calendar.json` | Optional health calendar |
| [`minimal-notes-journal-private-highlights.template.json`](minimal-notes-journal-private-highlights.template.json) | `minimal-notes-journal-private-highlights.json` | Optional private journal highlighting rules |

Notes:

- `minimal-notes-health-summary.json` shows a top health summary.
- `minimal-notes-health-calendar.json` shows a monthly health calendar.
- `minimal-notes-journal-private-highlights.json` adds your own journal location aliases, keyword groups, regular-expression rules, or suppression rules.

Health data is usually sensitive, so a private repository is recommended.

### FAQ

**Do I need to fork or download this project?**

No. Normal users can use the hosted link directly.

**Do I have to set up GitHub sync?**

No. If you only use one browser temporarily, local storage is enough. For multiple devices, GitHub sync is recommended. For desktop-only sync, a cloud-drive sync file can also work.

**Do I need to create `minimal-notes-records.json` myself?**

No. After GitHub sync is configured, the app creates and maintains this file automatically.

**Can I store my data files in this public repository?**

Not recommended. Use a separate private data repository. This public repository is for app code and public templates.

**What if I entered the wrong Token?**

Open `GitHub 同步` (`GitHub Sync`) again, enter the new Token, and click `保存同步` (`Save Sync`).

**401 or Bad credentials**

The Token is wrong, expired, or deleted. Create a new Token.

**403**

The Token does not have write access. Make sure `Contents` is set to `Read and write`, and make sure the Token is scoped to the correct data repository.

**404**

The repository, branch, or file path may be wrong. Repository format should look like:

```text
your-username/repository-name
```

**Can other people see my records?**

If your data repository is public, they may be able to see them. Use a private repository.

### For Developers

This is a static web app. The main file is `index.html`. If you want to modify the app, download the repository and edit `index.html`. GitHub Pages deployment does not require a backend service.
