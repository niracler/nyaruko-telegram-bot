# Nyaruko Telegram Bot

[English](README.md) | [简体中文](README.cn.md)

Welcome to the exotic Nyaruko Telegram Bot project! 🌟 This one-of-a-kind Telegram bot is deployed on the high-performance Cloudflare Workers. Nyaruko is not just any bot, but a sprite companion for Niracler, always ready to execute whimsical and unique tasks. Inspired by the leading character Nyaruko from "Haiyore! Nyaruko-san" and rooted in the Lovecraftian Mythos, our bot brings surprises and quirky fun at every corner! 👾

## Feature Introduction

Currently, Nyaruko has the following stunning features:

### `/sync_xlog` - Synchronize Telegram messages to xLog as Shorts

With the `/sync_xlog` command, Nyaruko can synchronize messages from Telegram to xLog as Shorts. This feature is still in development and does not support POST yet. 🚧

for more details, see [here](https://github.com/niracler/nyaruko-telegram-bot/pull/6), there are more complete examples.

<img width="400" src="https://github.com/niracler/nyaruko-telegram-bot/assets/24842631/fbaac6ed-bcf0-4f25-b706-af75fafb71b0">

### `/sync_twitter` - Synchronize Telegram messages to Twitter

With the `/sync_twitter` command, Nyaruko can synchronize messages from Telegram to Twitter.

for more details, see [here](https://github.com/niracler/nyaruko-telegram-bot/pull/2), there are more complete examples.

<div align=center>
  <img width="400" src="https://github.com/niracler/nyaruko-telegram-bot/assets/24842631/a557d8c6-f75a-4712-9c24-cea244668acf">
  <img width="400" src="https://github.com/niracler/nyaruko-telegram-bot/assets/24842631/da45b9dc-9d18-4f15-b6d1-a7ba2b10c74b">
</div>

### All Features list

- `/sync_xlog` - Sync msg to xLog as Shorts. (POST is not supported yet)
- `/sync_twitter` - Sync msg to Twitter.
- `/ping` - Test if the bot is online.
- `/getchatid` - Get the ID of the current chat.
- `/getuserid` - Get the ID of the current user.
- @nyaruko_aibot - You can chat with Nyaruko!

### More features coming soon

The capabilities of Nyaruko are continuously evolving, and more exciting features will be launched in the future.

## How to Run Nyaruko

To get Nyaruko up and running in your environment, please follow these steps:

1. Prepare your Cloudflare Workers environment.
2. Configure the necessary environment variables using the `wrangler secret` command to set them.
3. Deploy the Nyaruko bot to Cloudflare Workers.

### Clone and Enter the Project Directory

```bash
git clone https://github.com/niracler/nyaruko-telegram-bot && cd nyaruko-telegram-bot
```

### Environment Variables

Nyaruko requires the following environment variables to function:

|Variable Name|Required|Configuration Method|Description|
|---|---|---|---|
|`ALLOWED_USER_IDS`|Yes|`wrangler.yml`|List of user IDs allowed to use the bot, separated by commas|
|`TELEGRAM_BOT_USERNAME`|No|`wrangler.yml`|Your Telegram bot username, used to enable AI chat|
|`TELEGRAM_BOT_SECRET`|Yes|`secret`|Your Telegram bot secret key ([details](https://core.telegram.org/bots#how-do-i-create-a-bot))|
|`XLOG_TOKEN`|No|`secret`|xLog token. Used to enable xlog synchronization|
|`XLOG_CHARACTER_ID`|No|`secret`|xLog characterId|
|`TWITTER_API_KEY`|No|`secret`|Your Twitter API key ([details](https://developer.twitter.com/en/portal/dashboard)), used to enable Twitter synchronization|
|`TWITTER_API_SECRET`|No|`secret`|Your Twitter API secret key|
|`TWITTER_ACCESS_TOKEN`|No|`secret`|Twitter access token|
|`TWITTER_ACCESS_TOKEN_SECRET`|No|`secret`|Twitter access token secret|
|`OPENAI_API_KEY`|No|`secret`|OpenAI API key. Used to enable AI chat|

### About Setting Environment Variables

To set up environment variables, please use the `wrangler` CLI tool of Cloudflare Workers as follows:

```bash
wrangler secret put TELEGRAM_BOT_SECRET
# Enter the corresponding value when prompted

wrangler secret put TWITTER_API_KEY
# Repeat the above steps to set all required variables
...
```

For a more detailed explanation of wrangler configuration and commands, refer to the [official wrangler documentation](https://developers.cloudflare.com/workers/wrangler/commands/) (The wrangler documents are much easier to understand compared to the Twitter documentation, mainly because there are a lot more examples~~).

### Create D1 Database

Because Nyaruko uses D1 as its database, you need to create a D1 database and configure the corresponding environment variables. The configuration method is as follows:

```bash
wrangler d1 create tg
```

Then fill in the name of the D1 database returned into `wrangler.toml`, and change the database_id in my configuration file to your D1 database id.

> Note⚠️: Before Nyaruko is deployed, messages with multiple images will not be synchronized to xLog because the corresponding media_group_id cannot be found in the D1 database. Later, we will consider creating a script to synchronize historical messages.

```toml
[[d1_databases]]
binding = "DB" # i.e. available in your Worker on env.DB
database_name = "tg"
database_id = "******"
```

create database table
  
```bash
wrangler d1 execute tg --file=./schema.sql
```

### Deploy to Cloudflare Workers

After completing the above steps, you can deploy Nyaruko to Cloudflare Workers.

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

### Set Webhook for Telegram Bot

After deploying Nyaruko to Cloudflare Workers, you need to set the webhook for the Telegram bot. The configuration method is as follows:

```bash
curl -F "url=https://your-worker.your-name.workers.dev/" https://api.telegram.org/bot<TELEGRAM_BOT_SECRET>/setWebhook
```

Now, Nyaruko is ready to use! 🎉  

### Set Commands for Nyaruko (Not necessary)

Find botfather, then enter `/setcommands`, then select your bot, and then enter the following content:

```bash
sync_twitter - Sync msg to Twitter.
sync_xlog - Sync msg to Twitter.
ping - Test if the bot is online.
getchatid - Get the ID of the current chat.
getuserid - Get the ID of the current user.
```

## Little Secret of Nyaruko

The name Nyaruko originates from the Japanese light novel series “Haiyore! Nyaruko-san,” where the heroine Nyaruko is an energetic and positive Cthulhu mythical creature modeled after Nyarlathotep from Lovecraftian Mythos. In the Nyaruko bot, it represents a symbol of intelligence and vitality, not only assisting Niracler in message handling but also adding a touch of two-dimensional fun to life! 🌈

🎉 We wish you enjoyable interactions and cooperation with Nyaruko! If you have any suggestions for Nyaruko, please feel free to contact us. We keep an open mind and warmly welcome ideas for Nyaruko’s growth and improvement! 💌
