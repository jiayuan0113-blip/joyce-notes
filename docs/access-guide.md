# 多电脑 / Agent 接入与权限管理手册

> 目标:让**另一台电脑或它上面的 AI agent**能连上 `joyce-notes` 这个私有仓库(clone / pull / push),并且权限**可控、可随时收回**。
>
> 仓库:`https://github.com/jiayuan0113-blip/joyce-notes`(当前 PRIVATE)
> 账号:`jiayuan0113-blip`

---

## 0. 先搞懂一件事:别再到处用"整个账号的钥匙"

你之前那个 `~/.claude/skills` 仓库,remote 里嵌了一个**明文 token**——那是个安全隐患。
本手册的核心原则就一句:

> **给谁用、就只给那一份能单独收回的最小权限。** 不要把账号密码 / 全权 token 散出去,更不要写进任何文件或提交进仓库。

---

## 1. 三种接入方式怎么选

| 方式 | 适合谁 | 权限范围 | 能否限定单仓库 | 能否只读 | 回收难度 | 推荐度 |
|------|--------|----------|:--:|:--:|:--:|:--:|
| **A. Fine-grained PAT(细粒度令牌)** | 给 **agent / 自动化脚本** | 可精确到"只有这一个仓库" | ✅ | ✅ | 删 token 即可 | ⭐⭐⭐ 最推荐 |
| **B. `gh auth login`** | **你自己**的另一台电脑 | 整个账号(所有仓库) | ❌ | ❌ | 在该机器登出 / 网页吊销 | ⭐⭐ 最省事 |
| **C. Deploy Key(部署密钥)** | 固定某台机器,走 SSH | 就这一个仓库 | ✅ | ✅(建库时勾选) | 删 key 即可 | ⭐⭐ 稳 |

**一句话决策:**
- 是"我自己另一台 Mac" → 选 **B**,5 分钟搞定。
- 是"一个 agent / 一台服务器 / 想精细控权" → 选 **A**(或 C)。

---

## 2. 方式 A:Fine-grained PAT(最推荐,给 agent 用)

### 2.1 在 GitHub 网页生成令牌(在你主电脑上做)

1. 打开 https://github.com/settings/personal-access-tokens/new
   (路径:头像 → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token)
2. 填写:
   - **Token name**:写清楚谁在用,例如 `joyce-notes-agent-macbook2`
   - **Expiration**:设个**过期时间**(建议 90 天,到期自动失效,更安全)
   - **Resource owner**:选 `jiayuan0113-blip`
   - **Repository access** → 选 **Only select repositories** → 勾选 **`joyce-notes`**(关键:只授权这一个仓库)
   - **Permissions** → 展开 **Repository permissions** → 找 **Contents** → 设为:
     - `Read and write`(要能 push)
     - 或 `Read-only`(只让它拉取、不让改)
   - (其他权限一律保持 No access)
3. 点 **Generate token**,**立刻复制**那串 `github_pat_...`(只显示这一次,关掉就没了)。

> ⚠️ 这串 token 等于这个仓库的钥匙。**只在目标机器上粘贴使用,别贴进聊天、别写进代码、别提交进仓库。**

### 2.2 在另一台电脑上接入

**推荐做法:用钥匙串/凭证管理器存,而不是把 token 写进 remote URL。**

macOS / 装了 `gh` 的机器,最简单:

```bash
# 在另一台电脑上,用 token 登录(把 token 通过环境变量喂给 gh,不留痕迹)
echo "粘贴你的token" | gh auth login --with-token   # 或交互式 gh auth login 选 "Paste token"
git clone https://github.com/jiayuan0113-blip/joyce-notes.git
```

没有 `gh`、只用原生 git 的机器(用系统凭证管理器缓存,避免明文):

```bash
git clone https://github.com/jiayuan0113-blip/joyce-notes.git
# 第一次 push/pull 时会提示输入用户名和密码:
#   Username: jiayuan0113-blip
#   Password: 粘贴 github_pat_... (token 当密码用,不是账号密码)
# macOS 会自动存进钥匙串,之后不用再输
```

> ❌ **反面教材(别这么干)**:`git clone https://<token>@github.com/...`
> 这会把 token 明文写进 `.git/config`,正是你上一个仓库踩的坑。

---

## 3. 方式 B:`gh auth login`(你自己另一台电脑,最省事)

就是我们这次给你主电脑做的那套。在另一台电脑上:

```bash
brew install gh          # 如果还没装
gh auth login            # 选 GitHub.com → HTTPS → Login with a web browser
                         # 终端会显示一个 XXXX-XXXX 验证码,在弹出的网页里填
git clone https://github.com/jiayuan0113-blip/joyce-notes.git
```

**注意**:这等于把**整个账号**的访问权给了那台机器(能看/改你所有仓库)。
只适合**你自己的设备**,不要对不完全可信的机器或第三方 agent 用。

---

## 4. 方式 C:Deploy Key(单仓库 SSH,固定机器最稳)

适合一台长期固定的机器,且你想要"只读"或"只这一个仓库读写"。

### 4.1 在那台机器上生成专用密钥

```bash
ssh-keygen -t ed25519 -C "joyce-notes-deploy" -f ~/.ssh/joyce_notes_deploy
# 一路回车(可不设密码)。生成两个文件:
#   ~/.ssh/joyce_notes_deploy       (私钥,留在本机,绝不外传)
#   ~/.ssh/joyce_notes_deploy.pub   (公钥,要贴到 GitHub)
cat ~/.ssh/joyce_notes_deploy.pub   # 复制这串公钥
```

### 4.2 把公钥加到仓库(在你主电脑/网页上做)

1. 打开 https://github.com/jiayuan0113-blip/joyce-notes/settings/keys
2. **Add deploy key** → Title 写机器名 → 粘贴上面那串 `.pub` 公钥
3. **是否勾选 "Allow write access"**:
   - 勾上 = 该机器能 push(读写)
   - 不勾 = **只读**(只能 pull)
4. 保存。

### 4.3 在那台机器上用 SSH 克隆

```bash
# 告诉 ssh 这个仓库用哪把私钥
cat >> ~/.ssh/config <<'EOF'
Host github-joyce-notes
  HostName github.com
  User git
  IdentityFile ~/.ssh/joyce_notes_deploy
EOF

git clone git@github-joyce-notes:jiayuan0113-blip/joyce-notes.git
```

---

## 5. 权限管理与回收(随时能"收回钥匙")

| 你想做的事 | 怎么操作 |
|------------|----------|
| **吊销某个 PAT(方式 A)** | https://github.com/settings/tokens?type=beta → 找到那个 token → **Revoke**。立即失效。 |
| **改 PAT 权限(读写↔只读)** | 同上页面 → 进入 token → 改 Contents 权限 / 改授权仓库。 |
| **让某台电脑下线(方式 B)** | 网页 https://github.com/settings/sessions 或在那台机器 `gh auth logout`;彻底点可改账号密码。 |
| **移除某台机器的 Deploy Key(方式 C)** | https://github.com/jiayuan0113-blip/joyce-notes/settings/keys → 删除对应 key。 |
| **看谁有仓库访问权** | 仓库 Settings → Collaborators / Deploy keys 两处都看一遍。 |
| **令牌自动失效** | 生成 PAT 时设了 Expiration,到期自动作废(强烈建议都设)。 |

> 🔁 建议:给每台机器/每个 agent **发各自独立的 token 或 key**,并在名字里写清是谁。
> 这样要收回某一台,只删它那一份,不影响其他机器。

---

## 6. 另一种思路:给 agent 单独的 GitHub 账号(可选,进阶)

如果这个 agent 不只是"你自己用",而是要长期、独立运行,可以:
1. 给它注册一个独立 GitHub 账号(如 `joyce-notes-bot`);
2. 在 `joyce-notes` 仓库 **Settings → Collaborators** 里把它加为协作者,权限选 **Read** 或 **Write**;
3. 它用自己的账号 + 自己的 PAT 接入。

好处:它的所有提交都以独立身份出现,权限完全独立,踢掉它只需移除协作者。
适合"把控制权交出去但要能随时收回"的正式场景。

---

## 7. 日常使用(任意机器接入后)

```bash
# 每次开始写之前,先拉最新,避免多机冲突
git pull

# 写完一篇笔记后
git add -A
git commit -m "add: <你这篇的主题>"
git push
```

**多电脑协作铁律**:**push 前先 pull**。两台机器都改了同一个文件才会冲突;笔记各写各的文件,基本不会撞。

---

## 8. 安全铁律(再强调一次)

1. **token / 私钥绝不进仓库、绝不进聊天、绝不进代码**。
2. remote URL 里**不要嵌 token**,凭证交给系统钥匙串 / `gh` / SSH 管理。
3. 每台机器一份独立凭证,**都设过期时间**。
4. 不用了立刻吊销;定期去 Settings 清理一遍没用的 token 和 key。
5. 怀疑哪份泄露了 → 先 **Revoke**,再换新的。

---

_最后更新:2026-06-08_
