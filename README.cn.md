# Nyaruko Telegram 机器人

欢迎来到充满异域风情的 `Nyaruko` Telegram 机器人项目！🌟 这是一个与众不同的 Telegram 机器人，部署在性能卓越的 Cloudflare Workers 上。我们的 Nyaruko 不仅仅是一个机器人，更是 Niracler 的精灵伙伴，随时准备执行各种奇妙而独特的任务。就像《潜行吧、奈亚子！！！》中的女主角奈亚子一样，这个机器人灵感来源于克苏鲁神话，奇趣横生、处处充满惊喜！👾

## 功能介绍

目前，Nyaruko 机器人能够实现以下惊艳的功能：

### `/sync_xlog` - 将 Telegram 信息同步到 xLog Shorts 上

通过 `/sync_xlog` 命令，Nyaruko 可以将 Telegram 中的信息同步到 xLog Shorts 上。不过呢，Nyaruko 还在成长中，当前还不支持同步 POST。

<div align=center>
	<img height="350" alt="image" src="https://github.com/niracler/nyaruko-telegram-bot/assets/24842631/db2249d7-9b5e-4cc7-9544-0a48bc9c402c">
	<img height="350" alt="image" src="https://github.com/niracler/nyaruko-telegram-bot/assets/24842631/cd6260de-cbba-460d-b2d1-08b462c91b4b">
</div>

### `/sync_twitter` - 将 Telegram 信息同步到 Twitter

同上，通过 `/sync_twitter` 命令，Nyaruko 可以将 Telegram 中的信息同步到 Twitter 上。

详情请看 [这里](https://github.com/niracler/nyaruko-telegram-bot/pull/2), 有更完整的例子。

<div align=center>
  <img height="240" alt="image" src="https://github.com/niracler/nyaruko-telegram-bot/assets/24842631/a557d8c6-f75a-4712-9c24-cea244668acf">
  <img height="240" alt="image" src="https://github.com/niracler/nyaruko-telegram-bot/assets/24842631/da45b9dc-9d18-4f15-b6d1-a7ba2b10c74b">
</div>

### 所有功能列表

- `/sync_xlog` - 将 Telegram 信息同步到 xLog 上，以 Shorts 的形式。(暂不支持同步 POST)
- `/sync_twitter` - 将 Telegram 信息同步到 Twitter 上。
- `/ping` - 测试机器人是否在线。
- `/getchatid` - 获取当前对话的 ID。
- `/getuserid` - 获取当前用户的 ID。
- @nyaruko_aibot - 可以跟奈亚子聊天哦！

### 更多功能敬请期待

Nyaruko 的能力正在不断进化中，未来将会有更多激动人心的功能陆续上线。

## 如何运行 Nyaruko

想要让 Nyaruko 在您的环境中活跃起来，您需要按照下面的步骤进行配置：

1. 准备好您的 Cloudflare Workers 环境。
2. 配置必要的环境变量，使用 `wrangler secret` 命令来设置它们。
3. 部署 Nyaruko 机器人到 Cloudflare Workers。

### 克隆并进入项目目录

```bash
git clone https://github.com/niracler/nyaruko-telegram-bot && cd nyaruko-telegram-bot
```

### 环境变量

Nyaruko 需要以下环境变量的支持来发挥其作用：

|变量名|是否必须|配置方式|描述|
|---|---|---|---|
|`ALLOWED_USER_IDS`|是|`wrangler.yml`|允许使用机器人的用户 ID 列表，以逗号分隔|
|`TELEGRAM_BOT_USERNAME`|否|`wrangler.yml`|您的 Telegram 机器人用户名，用于开启 ai 聊天功能|
|`TELEGRAM_BOT_SECRET`|是|`secret`|您的 Telegram 机器人密钥（[详情参考](https://core.telegram.org/bots#how-do-i-create-a-bot) |
|`XLOG_TOKEN`|否|`secret`|xLog 的 token。用于开启 xlog 同步功能|
|`XLOG_CHARACTER_ID`|否|`secret`|xLog 的 characterId。|
|`TWITTER_API_KEY`|否|`secret`|您的 Twitter API 密钥([详情参考](https://developer.twitter.com/en/portal/dashboard)), 用于开启 twitter 同步功能|
|`TWITTER_API_SECRET`|否|`secret`|您的 Twitter API 密钥密文|
|`TWITTER_ACCESS_TOKEN`|否|`secret`|Twitter 的访问令牌|
|`TWITTER_ACCESS_TOKEN_SECRET`|否|`secret`|Twitter 的访问令牌密文|
|`TWITTER_USER_ID`|否|`wrangler.yml`|您的 Twitter 用户 ID|
|`OPENAI_API_KEY`|否|`secret`|OpenAI 的 API 密钥。用于开启 ai 聊天功能|

### 关于设置环境变量

环境变量的设置请使用 Cloudflare Workers 的 `wrangler` CLI 工具，具体命令如下：

```bash
wrangler secret put TELEGRAM_BOT_SECRET
# 在提示后输入相应的值

wrangler secret put TWITTER_API_KEY
# 重复上述步骤设置所有需要的变量
...
```

更详细的 wrangler 配置和命令说明，请查阅 [官方 wrangler 文档](https://developers.cloudflare.com/workers/wrangler/commands/) (wrangler 文档感觉要比 twitter 文档好懂得多了，起码事例会多很多～～)。

### 创建 D1 数据库

因为 media_group 的信息是通过 D1 数据库来存储的，所以需要创建一个 D1 数据库

> 注意⚠️：在奈亚子部署起来之前的多张图的消息，会因为没有在 D1 数据库中找到对应的 media_group_id 而无法同步到 xLog 上。后面会考虑弄一个同步历史消息的脚本

```bash
wrangler d1 create tg
```

然后将返回的 D1 数据库的名称填入到 `wrangler.toml` 中，将我配置文件中的 database_id 改成你的 D1 数据库 id

```toml
[[d1_databases]]
binding = "DB" # i.e. available in your Worker on env.DB
database_name = "tg"
database_id = "******"
```

创建数据库表
  
```bash
wrangler d1 execute tg --file=./schema.sql
```

### 部署到 cloudflare worker

完成上述步骤后，就可以将 Nyaruko 部署到 Cloudflare Workers 上了。

```bash
$ wrangler deploy
  ...
Total Upload: 708.54 KiB / gzip: 123.26 KiB
Uploaded nyaruko-telegram-bot (3.10 sec)
Published nyaruko-telegram-bot (0.44 sec)
  https://your-worker.your-name.workers.dev/"
Current Deployment ID: ***
  ...
```

### 设置奈亚子的 Webhook

将奈亚子的 Webhook 设置为您 Cloudflare Workers 地址，例如：

```bash
curl -F "url=https://your-worker.your-name.workers.dev/" https://api.telegram.org/bot<TELEGRAM_BOT_SECRET>/setWebhook
```

届此，Nyaruko 机器人已经部署完成，您可以在 Telegram 上进行测试了。

### 奈亚子的命令注册 (可选)

找到 botfather，然后输入 `/setcommands`，然后选择你的机器人，然后输入以下内容：

```bash
sync_twitter - Sync msg to Twitter.
sync_xlog - Sync msg to Twitter.
ping - Test if the bot is online.
getchatid - Get the ID of the current chat.
getuserid - Get the ID of the current user.
```

## 奈亚子的小秘密

Nyaruko 的名字来源于日本轻小说《潜行吧！奈亚子》，女主角奈亚子是一位积极向上、充满活力的克苏鲁神秘生物，她的形象是根据克苏鲁神话中的尼亚拉托提普塑造的。在 Nyaruko 机器人中，它代表了智能与活力的象征，不仅助力 Niracler 处理信息，还带着点二次元的趣味，为生活添彩！🌈

🎉 祝您和 Nyaruko 有着愉快的交流与合作！如果您对 Nyaruko 有任何建议，欢迎与我们取得联系，我们为 Nyaruko 的成长和进步保持着开放的心态和热忱的欢迎！💌
