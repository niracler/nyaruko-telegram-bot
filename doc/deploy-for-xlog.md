---
score: 60
---

# 简单易懂的 TG to xLog Shorts 机器人部署方案 - v1

具体技术： cloudlfare worker + telegram bot api + xlog shorts 。总之免费就是了

(效果图)
<img width="400" src="https://github.com/niracler/nyaruko-telegram-bot/assets/24842631/fbaac6ed-bcf0-4f25-b706-af75fafb71b0">

## 事前准备

1. 安装 wrangler 并登录 (若没有 cloudflare 帐号的同学，可以趁这个机会注册，[注册链接](https://dash.cloudflare.com/sign-up)，没有 nodejs 的同学也可以去安装一下，[nodejs 下载链接](https://nodejs.org/zh-cn/download/))

    ```bash
    npm install -g wrangler 
    wrangler login
    ```

2. 找 botfather 申请一个机器人，获取 token，[申请链接](https://t.me/botfather)
   (像下面这样就可以了)

    <img width="549" alt="image" src="https://github.com/niracler/nyaruko-telegram-bot/assets/24842631/8348ee9e-165d-4434-95ec-73ddcdaf3f75">

3. 拿到 xLog 的 token 以及 characterId，可以参考 [辛宝 Otto 的 token 获取教程](https://blog.ijust.cc/play-xlog-02)
    就是在 xSettings 的页面，点开当前的 character，在浏览器的控制台里面输入下面的代码就可以了

    ```javascript
    JSON.parse(localStorage.getItem('connect-kit:account')).state.wallet.siwe.token
    JSON.parse(localStorage.getItem('connect-kit:account')).state.wallet.characterId
    ```

## 开始部署

### 克隆并进入项目目录

```bash
git clone https://github.com/niracler/nyaruko-telegram-bot && cd nyaruko-telegram-bot
```

### 设置各种密钥

这三个分别是机器人的 token，xLog 的 token，xLog 的 characterId

```bash
wrangler secret put TELEGRAM_BOT_SECRET
wrangler secret put XLOG_TOKEN
wrangler secret put XLOG_CHARACTER_ID
```

### 修改 wrangler.toml

```toml
```

### 部署到 cloudflare worker

```bash
wrangler deploy
```

好了，完成了，现在可以去 tg 上测试一下了
怎么说呢，奈亚子还有其他功能的详情可以看

<https://github.com/niracler/nyaruko-telegram-bot>

## 关于技术选型为什么是长这样

肯定不是因为我只会写 typescript 啦（逃

1. cloudflare 是免费的啊，而且又不需要开代理就能访问 Telegram API。
2. crossbell 的 SDK 是 typescript 的，若用其他语言的话，就有手拼 ipfs 的上传逻辑了

## 后记 - 路漫漫其修远兮

- [ ] debug 模式
- [ ] 能用的账户列表
- [ ] README 要跟进好，加上上面的部署部分
- [ ] 后面再做的拆分项目的工作
- [ ] 教程中 clone 的版本应该是 release 版本，main 的话有点太过超前了

## 参考资料

- [cloudflare worker 文档](https://developers.cloudflare.com/workers) - cloudflare 的文档是真的好，而且还有中文版
- [技术角度折腾 xlog】更顺畅的使用体验 2 深入理解 xlog 的鉴权](https://blog.ijust.cc/play-xlog-02) - 辛宝 Otto 的 xlog 教程，写的很详细，而且还有视频教程～～
