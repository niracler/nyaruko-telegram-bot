# Nyaruko Telegram 机器人

欢迎来到充满异域风情的 `Nyaruko` Telegram 机器人项目！🌟 这是一个与众不同的 Telegram 机器人，部署在性能卓越的 Cloudflare Workers 上。我们的 Nyaruko 不仅仅是一个机器人，更是 Niracler 的精灵伙伴，随时准备执行各种奇妙而独特的任务。就像《潜行吧、奈亚子！！！》中的女主角奈亚子一样，这个机器人灵感来源于克苏鲁神话，奇趣横生、处处充满惊喜！👾

## 功能介绍

目前，Nyaruko 机器人能够实现以下惊艳的功能：

### `/sync_twitter` - 将 Telegram 信息同步到 Twitter

通过 `/sync_twitter` 命令，Nyaruko 可以将 Telegram 中的信息同步到 Twitter 上。让你的思绪像翅膀一样，飞跃到另一个社交圈。🕊️ 不过呢，Nyaruko 还在成长中，当前还不支持超链接以及处理 Telegram 的 `media_group`。这需要在 Cloudflare 中巧妙地缓存历史，相信不久之后，Nyaruko 将学会这项新技能！🎓

<div align=center>
  <img width="400" src="doc/image2.png">
  <img width="400" src="doc/image1.png">
</div>

### 更多功能敬请期待

Nyaruko 的能力正在不断进化中，未来将会有更多激动人心的功能陆续上线。

## 如何运行 Nyaruko

想要让 Nyaruko 在您的环境中活跃起来，您需要按照下面的步骤进行配置：

1. 准备好您的 Cloudflare Workers 环境。
2. 配置必要的环境变量，使用 `wrangler secret` 命令来设置它们。
3. 部署 Nyaruko 机器人到 Cloudflare Workers。

### 必要的环境变量

Nyaruko 需要以下环境变量的支持来发挥其作用：

- `ALLOWED_USER_IDS`：允许使用机器人的用户 ID 列表，以逗号分隔。这一个是设置在 wrangler.yml 中的，不需要使用 `wrangler secret` 命令设置。
- `TELEGRAM_BOT_SECRET`：您的 Telegram 机器人密钥。
- `TWITTER_API_KEY`：您的 Twitter API 密钥。
- `TWITTER_API_SECRET`：您的 Twitter API 密钥密文。
- `TWITTER_ACCESS_TOKEN`：Twitter 的访问令牌。
- `TWITTER_ACCESS_TOKEN_SECRET`：Twitter 的访问令牌密文。

[点击这里](https://developer.twitter.com/en/portal/dashboard) 来获取 Twitter 相关的 token。

[点击这里](https://core.telegram.org/bots#6-botfather) 可以了解更多关于获取 Telegram Bot Token 的信息。

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

## 奈亚子的小秘密

Nyaruko 的名字来源于日本轻小说《潜行吧！奈亚子》，女主角奈亚子是一位积极向上、充满活力的克苏鲁神秘生物，她的形象是根据克苏鲁神话中的尼亚拉托提普塑造的。在 Nyaruko 机器人中，它代表了智能与活力的象征，不仅助力 Niracler 处理信息，还带着点二次元的趣味，为生活添彩！🌈

🎉 祝您和 Nyaruko 有着愉快的交流与合作！如果您对 Nyaruko 有任何建议，欢迎与我们取得联系，我们为 Nyaruko 的成长和进步保持着开放的心态和热忱的欢迎！💌
