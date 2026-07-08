# Minimal Notes / 极简记录

Minimal Notes is a single-page personal notes app. You can use the hosted app directly:

[https://yihuhou.github.io/minimal-notes-app/](https://yihuhou.github.io/minimal-notes-app/)

No download, installation, or coding is required. By default, data stays in your browser. For sync, use your own private data repository or a cloud-drive JSON file.

---

## 中文说明

### 这是什么

极简记录是一个浏览器里的个人记录工具，适合记录：

- 待办、日程、截止事项
- 临时想法
- 日记
- 可选的健康小结和健康月历

打开网页后，在输入框里写内容，按 `Enter` 保存。常见写法：

```text
明天 10 点开会
DDL 6月10日前交材料
想法：以后做一个手机端快捷入口
日记：今天把论文引言改完了
```

页面支持筛选、搜索、完成/准备状态、编辑、导入 JSON、导出 JSON、GitHub 同步、桌面端云盘同步文件，以及可选的健康数据展示。

### 数据保存原则

如果什么都不设置，记录只保存在当前浏览器里。这适合临时使用，但换设备、换浏览器或清理浏览器数据后，原记录可能不可见。

如果要长期使用，推荐准备一个自己的私有 GitHub 数据仓库。这个公开仓库只托管网页应用，不应该保存你的私人记录、Token 或健康数据。

推荐的数据仓库结构如下：

```text
minimal-notes-data/
  minimal-notes-records.json
  minimal-notes-health-summary.json              可选
  minimal-notes-health-calendar.json             可选
  minimal-notes-journal-private-highlights.json  可选
```

### 从模板开始

这个公开仓库提供了可复制的模板文件：

| 模板 | 复制到你的数据仓库后改名为 | 用途 |
| --- | --- | --- |
| [`minimal-notes-records.template.json`](minimal-notes-records.template.json) | `minimal-notes-records.json` | 主记录同步文件 |
| [`minimal-notes-health-summary.template.json`](minimal-notes-health-summary.template.json) | `minimal-notes-health-summary.json` | 可选健康小结 |
| [`minimal-notes-health-calendar.template.json`](minimal-notes-health-calendar.template.json) | `minimal-notes-health-calendar.json` | 可选健康月历 |
| [`minimal-notes-journal-private-highlights.template.json`](minimal-notes-journal-private-highlights.template.json) | `minimal-notes-journal-private-highlights.json` | 可选日记私有高亮词表 |

普通用户只需要第一个文件。你也可以不手动创建它，直接在应用里开启 GitHub 同步后让应用自动写入。

最小的主记录文件长这样：

```json
{
  "version": 3,
  "savedAt": "2026-07-08T00:00:00.000Z",
  "records": [],
  "deletedRecords": [],
  "recurrenceCompletionArchive": []
}
```

### 设置 GitHub 同步

1. 新建一个私有 GitHub 仓库，例如 `minimal-notes-data`。
2. 可选：把 `minimal-notes-records.template.json` 复制进去，并改名为 `minimal-notes-records.json`。
3. 创建一个 fine-grained personal access token。
4. 打开应用，点击输入框下方的 `...`。
5. 点击 `GitHub 同步`，填入自己的数据仓库信息。

Token 创建建议：

1. 打开 [GitHub Token 设置页面](https://github.com/settings/personal-access-tokens)。
2. 点击 `Generate new token`。
3. 名字可以填 `Minimal Notes Sync`。
4. `Repository access` 选择 `Only select repositories`。
5. 只选择你的数据仓库，例如 `minimal-notes-data`。
6. 在 `Repository permissions` 里把 `Contents` 设置为 `Read and write`。
7. 生成 Token，并立刻复制保存。GitHub 通常只显示一次。

应用里的字段这样填：

| 字段 | 填什么 |
| --- | --- |
| GitHub 仓库 | `你的用户名/仓库名`，例如 `alice/minimal-notes-data` |
| GitHub 分支 | 通常是 `main` |
| 数据文件路径 | 通常是 `minimal-notes-records.json` |
| GitHub Token | 你刚创建的 Token |

如果输入框里出现示例仓库或默认仓库，请替换成你自己的私有数据仓库。不要把 Token 授权给不属于你的仓库。

`保存同步` 会把同步设置保存在当前浏览器。`临时同步` 适合在临时设备上使用，不会长期保存同步设置和 Token。

### 云盘同步文件

电脑端 Chrome 或 Edge 支持把记录写入一个 JSON 文件。你可以把这个文件放在 iCloud Drive、OneDrive、Dropbox、坚果云等同步目录里。

使用方法：

1. 点击输入框下方的 `...`。
2. 点击 `新建同步文件`，把文件保存到云盘文件夹。
3. 另一台电脑打开同一个网页，点击 `连接同步文件`，选择同一个 JSON 文件。

如果已经开启 GitHub 同步，云盘按钮会变成 `新建备份`、`连接备份`。这时 GitHub 是主同步，云盘 JSON 只是额外备份。

注意：

- 云盘同步主要适合电脑端。
- 手机浏览器通常不支持这种文件访问方式。
- 多台电脑同时编辑同一个云盘文件时，云盘软件可能生成冲突副本。频繁多设备使用时，更推荐 GitHub 同步。

### 导入和导出

点击 `...` 后可以使用：

- `导出 JSON`：下载当前记录备份。
- `导入 JSON`：用 JSON 文件覆盖当前本地数据。

导入会覆盖当前本地记录。操作前建议先导出一份备份。

### 可选健康和日记扩展

这些扩展不是普通使用的必要条件。没有对应文件时，应用会继续作为普通记录工具运行。

- `minimal-notes-health-summary.json`：显示顶部健康小结、指标、建议和训练建议。可从模板开始填写。
- `minimal-notes-health-calendar.json`：显示本月健康月历。模板使用的是紧凑格式，适合手动或脚本生成。
- `minimal-notes-health-history.json`：更原始的健康历史文件。应用会在没有 `minimal-notes-health-calendar.json` 时尝试读取它。
- `minimal-notes-journal-private-highlights.json`：给日记高亮添加自己的地点别名、关键词组、正则规则，或隐藏误识别的词。

如果这些文件放在你的 GitHub 数据仓库里，应用会通过同一个 Token 读取它们。如果你自己部署网页，也可以把这些 JSON 放在网页根目录。健康数据通常很敏感，建议只放在私有仓库里。

### 常见问题

**我需要 fork 或下载这个项目吗？**

不需要。普通用户直接打开托管链接就能用。

**我一定要设置 GitHub 同步吗？**

不一定。只在一个浏览器里临时使用，可以不设置。要跨手机和电脑同步，推荐 GitHub 同步。

**我可以把数据文件放在这个公开仓库里吗？**

不建议。请单独创建私有数据仓库，公开仓库只用来托管应用代码和公开模板。

**提示 401 或 Bad credentials**

Token 错了、过期了，或者已经被删除。重新创建 Token。

**提示 403**

Token 没有写入权限。检查 `Contents` 是否为 `Read and write`，并确认 Token 授权了正确的数据仓库。

**提示 404**

仓库名、分支名或文件路径可能填错。仓库格式应该像 `alice/minimal-notes-data`。

**别人会看到我的记录吗？**

如果你的数据仓库是公开仓库，别人可能看到。建议使用私有仓库。

### 给开发者

这个项目是静态网页应用，主要文件是 `index.html`。可以直接 fork 或下载后修改。GitHub Pages 发布时不需要后端服务。

---

## English

### What Is This

Minimal Notes is a browser-based personal notes app for:

- todos, meetings, and deadlines
- quick ideas
- journals
- optional health summaries and health calendars

Use the hosted app here:

[https://yihuhou.github.io/minimal-notes-app/](https://yihuhou.github.io/minimal-notes-app/)

Type into the input box and press `Enter` to save.

```text
Meeting tomorrow at 10
DDL before June 10 submit materials
Idea: add a mobile shortcut
Journal: finished revising the introduction today
```

The app supports filtering, search, done/prepared states, editing, JSON import/export, GitHub sync, desktop cloud-drive sync files, and optional health data display.

### Data Storage

Without setup, records are saved only in the current browser. That is fine for temporary use, but switching devices, switching browsers, or clearing browser data may make old records unavailable.

For long-term use, create your own private GitHub data repository. This public repository hosts the web app only. Do not store private notes, tokens, or health data here.

Recommended data repository layout:

```text
minimal-notes-data/
  minimal-notes-records.json
  minimal-notes-health-summary.json              optional
  minimal-notes-health-calendar.json             optional
  minimal-notes-journal-private-highlights.json  optional
```

### Start From Templates

This public repository includes reusable template files:

| Template | Rename in your data repository | Purpose |
| --- | --- | --- |
| [`minimal-notes-records.template.json`](minimal-notes-records.template.json) | `minimal-notes-records.json` | Main records sync file |
| [`minimal-notes-health-summary.template.json`](minimal-notes-health-summary.template.json) | `minimal-notes-health-summary.json` | Optional health summary |
| [`minimal-notes-health-calendar.template.json`](minimal-notes-health-calendar.template.json) | `minimal-notes-health-calendar.json` | Optional health calendar |
| [`minimal-notes-journal-private-highlights.template.json`](minimal-notes-journal-private-highlights.template.json) | `minimal-notes-journal-private-highlights.json` | Optional private journal highlighting rules |

Most users only need the first file. You can also skip manual creation and let the app create the records file when GitHub sync is enabled.

Minimal main records file:

```json
{
  "version": 3,
  "savedAt": "2026-07-08T00:00:00.000Z",
  "records": [],
  "deletedRecords": [],
  "recurrenceCompletionArchive": []
}
```

### Set Up GitHub Sync

1. Create a private GitHub repository, for example `minimal-notes-data`.
2. Optional: copy `minimal-notes-records.template.json` into it and rename it to `minimal-notes-records.json`.
3. Create a fine-grained personal access token.
4. Open the app and click `...` under the input box.
5. Click `GitHub 同步` (`GitHub Sync`) and enter your data repository settings.

Recommended token setup:

1. Open [GitHub Token settings](https://github.com/settings/personal-access-tokens).
2. Click `Generate new token`.
3. Name it `Minimal Notes Sync`.
4. Set `Repository access` to `Only select repositories`.
5. Select only your data repository, such as `minimal-notes-data`.
6. Under `Repository permissions`, set `Contents` to `Read and write`.
7. Generate the token and copy it immediately. GitHub usually shows it only once.

App fields:

| Field | Value |
| --- | --- |
| GitHub repository | `your-username/repository-name`, for example `alice/minimal-notes-data` |
| GitHub branch | Usually `main` |
| Data file path | Usually `minimal-notes-records.json` |
| GitHub Token | The token you created |

If the form shows an example or default repository, replace it with your own private data repository. Do not grant your token access to a repository you do not control.

`保存同步` (`Save Sync`) stores the sync settings in the current browser. `临时同步` (`Temporary Sync`) is intended for temporary devices and does not keep the sync settings or token long term.

### Cloud-Drive Sync File

Desktop Chrome and Edge can write records to a JSON file. Put that file in iCloud Drive, OneDrive, Dropbox, Nutstore, or another synced folder.

How to use it:

1. Click `...` under the input box.
2. Click `新建同步文件` (`New sync file`) and save it into your cloud-drive folder.
3. On another computer, open the same web app, click `连接同步文件` (`Connect sync file`), and choose the same JSON file.

If GitHub sync is already enabled, these buttons become `新建备份` (`New backup`) and `连接备份` (`Connect backup`). In that mode, GitHub is the main sync method and the cloud-drive JSON file is only an extra backup.

Notes:

- Cloud-drive sync is mainly for desktop browsers.
- Mobile browsers usually do not support this file access method.
- If multiple computers edit the same cloud-drive file at the same time, your cloud-drive app may create conflict copies. For frequent multi-device use, GitHub sync is more reliable.

### Import And Export

Open `...` to use:

- `导出 JSON` (`Export JSON`): download a backup of current records.
- `导入 JSON` (`Import JSON`): replace current local data with a JSON file.

Import replaces current local records. Export a backup first if you need to keep the existing data.

### Optional Health And Journal Extensions

These files are not required for normal note taking. If they do not exist, the app still works as a regular notes app.

- `minimal-notes-health-summary.json`: shows a top health summary, metrics, advice, and training suggestion.
- `minimal-notes-health-calendar.json`: shows a monthly health calendar. The template uses a compact format that can be filled manually or generated by a script.
- `minimal-notes-health-history.json`: a more raw health history file. The app tries it when `minimal-notes-health-calendar.json` is absent.
- `minimal-notes-journal-private-highlights.json`: adds your own journal location aliases, keyword groups, regular-expression rules, or suppression rules.

When these files are stored in your GitHub data repository, the app reads them with the same token. If you self-host the app, you can also place these JSON files at the web root. Health data is usually sensitive, so a private repository is recommended.

### FAQ

**Do I need to fork or download this project?**

No. Normal users can use the hosted link directly.

**Do I have to set up GitHub sync?**

No. Local browser storage is enough for temporary single-browser use. For phone and computer sync, GitHub sync is recommended.

**Can I store my data files in this public repository?**

Not recommended. Use a separate private data repository. This public repository is for app code and public templates.

**401 or Bad credentials**

The token is wrong, expired, or deleted. Create a new token.

**403**

The token does not have write access. Make sure `Contents` is `Read and write`, and make sure the token is scoped to the correct data repository.

**404**

The repository, branch, or file path may be wrong. Repository format should look like `alice/minimal-notes-data`.

**Can other people see my records?**

If your data repository is public, they may be able to see them. Use a private repository.

### For Developers

This is a static web app. The main file is `index.html`. You can fork or download the repository and edit it directly. GitHub Pages deployment does not require a backend service.
