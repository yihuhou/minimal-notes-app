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

打开网页后，直接在输入框里写内容，按 `Enter` 保存。

示例：

```text
明天 10 点开会
DDL 6月10日前交材料
想法：以后做一个手机端快捷入口
```

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

不要把私人记录放在公开仓库里。

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

### 常见问题

**我需要 fork 或下载这个项目吗？**

不需要。普通用户直接打开上面的链接就能用。

**我一定要设置 GitHub 同步吗？**

不一定。只在一个浏览器里临时使用，可以不设置。想多设备同步，推荐设置 GitHub 同步；只在电脑之间同步，也可以用云盘同步文件。

**Token 填错了怎么办？**

重新打开 `GitHub 同步`，填新的 Token，再点 `保存同步`。

**提示 401 或 Bad credentials**

Token 错了、过期了，或者已经被删除。重新创建 Token。

**提示 403**

Token 没有写入权限。检查 `Contents` 是否设置成 `Read and write`。

**提示 404**

仓库名、分支名或文件路径可能填错了。仓库格式应该像这样：

```text
你的用户名/仓库名
```

**别人会看到我的记录吗？**

如果你的数据仓库是公开仓库，别人可能看到。建议使用私有仓库。

### 给开发者

这个项目是静态网页应用，主要文件是 `index.html`。如果你想自己改代码，可以下载仓库后直接编辑 `index.html`。

---

## English

### What Is This

Minimal Notes is an online personal notes app for:

- todos
- meetings
- deadlines
- quick ideas

Use it here:

[https://yihuhou.github.io/minimal-notes-app/](https://yihuhou.github.io/minimal-notes-app/)

Type something into the input box and press `Enter` to save.

Examples:

```text
Meeting tomorrow at 10
DDL before June 10 submit materials
Idea: add a mobile shortcut
```

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

Do not store private notes in a public repository.

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

### FAQ

**Do I need to fork or download this project?**

No. Normal users can use the hosted link directly.

**Do I have to set up GitHub sync?**

No. If you only use one browser temporarily, local storage is enough. For multiple devices, GitHub sync is recommended. For desktop-only sync, a cloud-drive sync file can also work.

**What if I entered the wrong Token?**

Open `GitHub 同步` (`GitHub Sync`) again, enter the new Token, and click `保存同步` (`Save Sync`).

**401 or Bad credentials**

The Token is wrong, expired, or deleted. Create a new Token.

**403**

The Token does not have write access. Make sure `Contents` is set to `Read and write`.

**404**

The repository, branch, or file path may be wrong. Repository format should look like:

```text
your-username/repository-name
```

**Can other people see my records?**

If your data repository is public, they may be able to see them. Use a private repository.

### For Developers

This is a static web app. The main file is `index.html`. If you want to modify the app, download the repository and edit `index.html`.
