import { answerInlineQuery, calculateNextOffset, getResultsForQuery, handleTelegramUpdate, processGetGroupIdCommand, processGetUserIdCommand, processPingCommand } from './core'
import { processLLM } from './llm'
import { processSyncXLogCommand } from './xlog'
import twitter from './twitter'
import { processChannel } from './channel'

import { TelegramUpdate } from './core/type'
import { Env as LLMEnv } from './llm'
import { Env as XLogEnv } from './xlog'
import { Env as TwitterEnv } from './twitter'

export type Env = LLMEnv & XLogEnv & TwitterEnv

async function handler(update: TelegramUpdate, env: Env): Promise<string | undefined> {
    const content = update.message?.text || update.message?.caption || ''

    if (update.inline_query) {
        console.log("inline_query", JSON.stringify(update.inline_query))
        const queryId = update.inline_query.id;
        const all = [
            // 这里的内容应当根据应用的特定信息填写，以下是示例
            {
                type: "photo",
                id: "bf83b899e85c49c999a47fb57c1a0e8d",
                title: "不死不幸 - 很好，这样就对了",
                photo_url: "https://image.pseudoyu.com/images/bf83b899e85c49c999a47fb57c1a0e8d.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/bf83b899e85c49c999a47fb57c1a0e8d.th.jpg",
                caption: "很好，这样就对了",
            },
            {
                type: "photo",
                id: "440a2a3ef71b5effe8b7693784021dca",
                title: "不死不幸 - 😠",
                photo_url: "https://image.pseudoyu.com/images/440a2a3ef71b5effe8b7693784021dca.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/440a2a3ef71b5effe8b7693784021dca.th.jpg",
                caption: "😠",
            },
            {
                type: "photo",
                id: "OO",
                title: "为美好的世界献上祝福 - 我喜欢OO",
                photo_url: "https://image.pseudoyu.com/images/OO.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/OO.th.jpg",
                caption: "我喜欢OO",
            },
            {
                type: "photo",
                id: "3aa722856d2781c2271e1959910445be",
                title: "为美好的世界献上祝福 - 虽然我不太懂，但是听起来很好呢",
                photo_url: "https://image.pseudoyu.com/images/3aa722856d2781c2271e1959910445be.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/3aa722856d2781c2271e1959910445be.th.jpg",
                caption: "虽然我不太懂，但是听起来很好呢",
            },
            {
                type: "photo",
                id: "de08a6b8964a2abd60b9426c8c062b9f",
                title: "入间同学入魔了 - 怎么会这样！忙到妈都不认得呢!!",
                photo_url: "https://image.pseudoyu.com/images/de08a6b8964a2abd60b9426c8c062b9f.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/de08a6b8964a2abd60b9426c8c062b9f.th.jpg",
                caption: "怎么会这样！忙到妈都不认得呢!!",
            },
            {
                type: "photo",
                id: "2770bba2d9bb6ec49ceffd86c1831998",
                title: "入间同学入魔了 - 能跟你聊一下吗？",
                photo_url: "https://image.pseudoyu.com/images/2770bba2d9bb6ec49ceffd86c1831998.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/2770bba2d9bb6ec49ceffd86c1831998.th.jpg",
                caption: "能跟你聊一下吗？",
            },
            {
                type: "photo",
                id: "fa6d94bc2182f044bb61bcf9e79132fb",
                title: "即使如此小镇依然转动 - 上个月打工的薪水还有剩，就买来当自己的生日礼物吧",
                photo_url: "https://image.pseudoyu.com/images/fa6d94bc2182f044bb61bcf9e79132fb.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/fa6d94bc2182f044bb61bcf9e79132fb.th.jpg",
                caption: "上个月打工的薪水还有剩，就买来当自己的生日礼物吧",
            },
            {
                type: "photo",
                id: "5b14fa9f9abfffad24381092a9bcf1ff",
                title: "即使如此小镇依然转动 - 好可爱，有够像猴子",
                photo_url: "https://image.pseudoyu.com/images/5b14fa9f9abfffad24381092a9bcf1ff.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/5b14fa9f9abfffad24381092a9bcf1ff.th.jpg",
                caption: "好可爱，有够像猴子",
            },
            {
                type: "photo",
                id: "7ccd493f2e167d8d63c6ca4885961683",
                title: "即使如此小镇依然转动 - 我到南十字星或煤炭袋都不会下车的",
                photo_url: "https://image.pseudoyu.com/images/7ccd493f2e167d8d63c6ca4885961683.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/7ccd493f2e167d8d63c6ca4885961683.th.jpg",
                caption: "我到南十字星或煤炭袋都不会下车的",
            },
            {
                type: "photo",
                id: "914e7cb21a5f5b5a9d951e5c9eaac878",
                title: "即使如此小镇依然转动 - 有够像猴子",
                photo_url: "https://image.pseudoyu.com/images/914e7cb21a5f5b5a9d951e5c9eaac878.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/914e7cb21a5f5b5a9d951e5c9eaac878.th.jpg",
                caption: "有够像猴子",
            },
            {
                type: "photo",
                id: "c516d286fbd0447dd33ddf05cf15de88",
                title: "坂本DAYS - 只有你还是老样子",
                photo_url: "https://image.pseudoyu.com/images/c516d286fbd0447dd33ddf05cf15de88.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/c516d286fbd0447dd33ddf05cf15de88.th.jpg",
                caption: "只有你还是老样子",
            },
            {
                type: "photo",
                id: "59baf08a79f0e253582fb0a2db36afef",
                title: "坂本DAYS - 是谁，又是为了什么",
                photo_url: "https://image.pseudoyu.com/images/59baf08a79f0e253582fb0a2db36afef.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/59baf08a79f0e253582fb0a2db36afef.th.jpg",
                caption: "是谁，又是为了什么",
            },
            {
                type: "photo",
                id: "1d89f481b5c900aa37d43332accb6856",
                title: "坂本DAYS - 没听懂",
                photo_url: "https://image.pseudoyu.com/images/1d89f481b5c900aa37d43332accb6856.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/1d89f481b5c900aa37d43332accb6856.th.jpg",
                caption: "没听懂",
            },
            {
                type: "photo",
                id: "163c360013feb1b3e46073e83b9a3db1",
                title: "坂本DAYS - 还胖成这样",
                photo_url: "https://image.pseudoyu.com/images/163c360013feb1b3e46073e83b9a3db1.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/163c360013feb1b3e46073e83b9a3db1.th.jpg",
                caption: "还胖成这样",
            },
            {
                type: "photo",
                id: "8d60f92a6beb08366e281f10cf2672a6",
                title: "宝石之国 - 我都会陪着你的",
                photo_url: "https://image.pseudoyu.com/images/8d60f92a6beb08366e281f10cf2672a6.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/8d60f92a6beb08366e281f10cf2672a6.th.jpg",
                caption: "我都会陪着你的",
            },
            {
                type: "photo",
                id: "f055378df3b2ecdd4f9620e7b5dec375",
                title: "宝石之国 - 空",
                photo_url: "https://image.pseudoyu.com/images/f055378df3b2ecdd4f9620e7b5dec375.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/f055378df3b2ecdd4f9620e7b5dec375.th.jpg",
                caption: "空",
            },
            {
                type: "photo",
                id: "c35e8a344505a5585138fc84d6c4b368",
                title: "宝石之国 - 花",
                photo_url: "https://image.pseudoyu.com/images/c35e8a344505a5585138fc84d6c4b368.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/c35e8a344505a5585138fc84d6c4b368.th.jpg",
                caption: "花",
            },
            {
                type: "photo",
                id: "50fc790f63ab2a654b61b915dff781e9",
                title: "异世界舅舅 - 睡觉了",
                photo_url: "https://image.pseudoyu.com/images/50fc790f63ab2a654b61b915dff781e9.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/50fc790f63ab2a654b61b915dff781e9.th.jpg",
                caption: "睡觉了",
            },
            {
                type: "photo",
                id: "ca330de8e6156bc1ee870a459b9440dd",
                title: "总之就是非常可爱 - 我觉得是无敌了",
                photo_url: "https://image.pseudoyu.com/images/ca330de8e6156bc1ee870a459b9440dd.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/ca330de8e6156bc1ee870a459b9440dd.th.jpg",
                caption: "我觉得是无敌了",
            },
            {
                type: "photo",
                id: "088e11039eca45434817ffdfb17e1b80",
                title: "总之就是非常可爱 - 才不是一千四百岁",
                photo_url: "https://image.pseudoyu.com/images/088e11039eca45434817ffdfb17e1b80.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/088e11039eca45434817ffdfb17e1b80.th.jpg",
                caption: "才不是一千四百岁",
            },
            {
                type: "photo",
                id: "3228f95f4375eee87c78ead15f6260ff",
                title: "总之就是非常可爱 - 绝对要赢",
                photo_url: "https://image.pseudoyu.com/images/3228f95f4375eee87c78ead15f6260ff.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/3228f95f4375eee87c78ead15f6260ff.th.jpg",
                caption: "绝对要赢",
            },
            {
                type: "photo",
                id: "6f63e3db30be211033b7e66e7c3d48e0",
                title: "我不受欢迎，怎么想都是你们的错！ - 你是大叔吗",
                photo_url: "https://image.pseudoyu.com/images/6f63e3db30be211033b7e66e7c3d48e0.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/6f63e3db30be211033b7e66e7c3d48e0.th.jpg",
                caption: "你是大叔吗",
            },
            {
                type: "photo",
                id: "d9873b1e9054ac7737305b44ba081753",
                title: "我不受欢迎，怎么想都是你们的错！ - 喜",
                photo_url: "https://image.pseudoyu.com/images/d9873b1e9054ac7737305b44ba081753.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/d9873b1e9054ac7737305b44ba081753.th.jpg",
                caption: "喜",
            },
            {
                type: "photo",
                id: "37e358aaed6c458e36a41bc8920c5f8b",
                title: "我不受欢迎，怎么想都是你们的错！ - 圣诞节快乐",
                photo_url: "https://image.pseudoyu.com/images/37e358aaed6c458e36a41bc8920c5f8b.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/37e358aaed6c458e36a41bc8920c5f8b.th.jpg",
                caption: "圣诞节快乐",
            },
            {
                type: "photo",
                id: "1ccd0f4faf576ef91384043970e0c419",
                title: "我不受欢迎，怎么想都是你们的错！ - 好多人",
                photo_url: "https://image.pseudoyu.com/images/1ccd0f4faf576ef91384043970e0c419.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/1ccd0f4faf576ef91384043970e0c419.th.jpg",
                caption: "好多人",
            },
            {
                type: "photo",
                id: "663631a55d3ef3a15e5da52d3d6b9feb",
                title: "我不受欢迎，怎么想都是你们的错！ - 怎么回事？虽然她好像是在说很帅气的话，但完全没有说到我心里去",
                photo_url: "https://image.pseudoyu.com/images/663631a55d3ef3a15e5da52d3d6b9feb.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/663631a55d3ef3a15e5da52d3d6b9feb.th.jpg",
                caption: "怎么回事？虽然她好像是在说很帅气的话，但完全没有说到我心里去",
            },
            {
                type: "photo",
                id: "4addc265c05cdd79b40ed94768838910",
                title: "我不受欢迎，怎么想都是你们的错！ - 恶心萌理论",
                photo_url: "https://image.pseudoyu.com/images/4addc265c05cdd79b40ed94768838910.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/4addc265c05cdd79b40ed94768838910.th.jpg",
                caption: "恶心萌理论",
            },
            {
                type: "photo",
                id: "825eadde5235287180418341f945987d",
                title: "我不受欢迎，怎么想都是你们的错！ - 打你",
                photo_url: "https://image.pseudoyu.com/images/825eadde5235287180418341f945987d.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/825eadde5235287180418341f945987d.th.jpg",
                caption: "打你",
            },
            {
                type: "photo",
                id: "2b215c8df0f7ef4d48e76aa0f72ac872",
                title: "我不受欢迎，怎么想都是你们的错！ - 萌就藏在恶心的部份之中，不是吗",
                photo_url: "https://image.pseudoyu.com/images/2b215c8df0f7ef4d48e76aa0f72ac872.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/2b215c8df0f7ef4d48e76aa0f72ac872.th.jpg",
                caption: "萌就藏在恶心的部份之中，不是吗",
            },
            {
                type: "photo",
                id: "6680060371749543862c6c5bf01dc741",
                title: "我不受欢迎，怎么想都是你们的错！ - 蠢蠢欲动",
                photo_url: "https://image.pseudoyu.com/images/6680060371749543862c6c5bf01dc741.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/6680060371749543862c6c5bf01dc741.th.jpg",
                caption: "蠢蠢欲动",
            },
            {
                type: "photo",
                id: "086f7f91d0372b16b13df8eb9de1535b",
                title: "我不受欢迎，怎么想都是你们的错！ - 这里的人全部都只会背刺我",
                photo_url: "https://image.pseudoyu.com/images/086f7f91d0372b16b13df8eb9de1535b.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/086f7f91d0372b16b13df8eb9de1535b.th.jpg",
                caption: "这里的人全部都只会背刺我",
            },
            {
                type: "photo",
                id: "eebaf9871dc45ec7c6b9893b62d31b05",
                title: "我不受欢迎，怎么想都是你们的错！ - 🙂",
                photo_url: "https://image.pseudoyu.com/images/eebaf9871dc45ec7c6b9893b62d31b05.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/eebaf9871dc45ec7c6b9893b62d31b05.th.jpg",
                caption: "🙂",
            },
            {
                type: "photo",
                id: "68475a853c5734cac778b29e9bf2d18b",
                title: "我推的孩子 - 不要，人家绝对不要",
                photo_url: "https://image.pseudoyu.com/images/68475a853c5734cac778b29e9bf2d18b.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/68475a853c5734cac778b29e9bf2d18b.th.jpg",
                caption: "不要，人家绝对不要",
            },
            {
                type: "photo",
                id: "ea7f652a7cf1bb6077fc83cdc91b998e",
                title: "我推的孩子 - 我要成为你推的孩子",
                photo_url: "https://image.pseudoyu.com/images/ea7f652a7cf1bb6077fc83cdc91b998e.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/ea7f652a7cf1bb6077fc83cdc91b998e.th.jpg",
                caption: "我要成为你推的孩子",
            },
            {
                type: "photo",
                id: "d156b7eb73f0112988e32ae3dff801b4",
                title: "我推的孩子 - 是吗。这不是挺好的吗",
                photo_url: "https://image.pseudoyu.com/images/d156b7eb73f0112988e32ae3dff801b4.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/d156b7eb73f0112988e32ae3dff801b4.th.jpg",
                caption: "是吗。这不是挺好的吗",
            },
            {
                type: "photo",
                id: "7c158866fa69eab2e787f8a3ef2404d2",
                title: "我推的孩子 - 毕竟对我来说，你们两个始终是嚣张有可爱的小孩子啊",
                photo_url: "https://image.pseudoyu.com/images/7c158866fa69eab2e787f8a3ef2404d2.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/7c158866fa69eab2e787f8a3ef2404d2.th.jpg",
                caption: "毕竟对我来说，你们两个始终是嚣张有可爱的小孩子啊",
            },
            {
                type: "photo",
                id: "c3a89b9cf5f0e31c9568beb97ca5b8da",
                title: "我推的孩子 - 老哥他实在是太喜欢我了",
                photo_url: "https://image.pseudoyu.com/images/c3a89b9cf5f0e31c9568beb97ca5b8da.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/c3a89b9cf5f0e31c9568beb97ca5b8da.th.jpg",
                caption: "老哥他实在是太喜欢我了",
            },
            {
                type: "photo",
                id: "love-and-peace",
                title: "我立于百万生命之上 - love and peace",
                photo_url: "https://image.pseudoyu.com/images/love-and-peace.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/love-and-peace.th.jpg",
                caption: "love and peace",
            },
            {
                type: "photo",
                id: "452f653965df086a671d6b4828826846",
                title: "我立于百万生命之上 - 为什么挂和后宫我一个都开不了啊！",
                photo_url: "https://image.pseudoyu.com/images/452f653965df086a671d6b4828826846.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/452f653965df086a671d6b4828826846.th.jpg",
                caption: "为什么挂和后宫我一个都开不了啊！",
            },
            {
                type: "photo",
                id: "68e38d843bcea25ca1611537683d9403",
                title: "我立于百万生命之上 - 你愿不愿意和我交往试试",
                photo_url: "https://image.pseudoyu.com/images/68e38d843bcea25ca1611537683d9403.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/68e38d843bcea25ca1611537683d9403.th.jpg",
                caption: "你愿不愿意和我交往试试",
            },
            {
                type: "photo",
                id: "e6894f98df96ba2df1934a25b6698726",
                title: "我立于百万生命之上 - 可惜我快你一步，已经变成大妈了。抱歉啊",
                photo_url: "https://image.pseudoyu.com/images/e6894f98df96ba2df1934a25b6698726.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/e6894f98df96ba2df1934a25b6698726.th.jpg",
                caption: "可惜我快你一步，已经变成大妈了。抱歉啊",
            },
            {
                type: "photo",
                id: "31313bfa0408e4117915ef99a1920593",
                title: "我立于百万生命之上 - 怎么？摆出一副纯情处男的表情，身子却往前屈，硬了？",
                photo_url: "https://image.pseudoyu.com/images/31313bfa0408e4117915ef99a1920593.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/31313bfa0408e4117915ef99a1920593.th.jpg",
                caption: "怎么？摆出一副纯情处男的表情，身子却往前屈，硬了？",
            },
            {
                type: "photo",
                id: "278a04703cc89392650a54d76b14b25f",
                title: "我立于百万生命之上 - 我们要永远在一起",
                photo_url: "https://image.pseudoyu.com/images/278a04703cc89392650a54d76b14b25f.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/278a04703cc89392650a54d76b14b25f.th.jpg",
                caption: "我们要永远在一起",
            },
            {
                type: "photo",
                id: "IT-",
                title: "我立于百万生命之上 - 我只会编程，可 IT 业也没有在这种不上不下的时间招人的",
                photo_url: "https://image.pseudoyu.com/images/IT-.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/IT-.th.jpg",
                caption: "我只会编程，可 IT 业也没有在这种不上不下的时间招人的",
            },
            {
                type: "photo",
                id: "f90d1cd6f1e55a9c4dcc1f42a266837c",
                title: "我立于百万生命之上 - 我可告诉你，全队就你跟我睡的次数最少",
                photo_url: "https://image.pseudoyu.com/images/f90d1cd6f1e55a9c4dcc1f42a266837c.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/f90d1cd6f1e55a9c4dcc1f42a266837c.th.jpg",
                caption: "我可告诉你，全队就你跟我睡的次数最少",
            },
            {
                type: "photo",
                id: "2aa49c055e03cceed634e8aad5537de3",
                title: "我立于百万生命之上 - 我是真的很开心呀",
                photo_url: "https://image.pseudoyu.com/images/2aa49c055e03cceed634e8aad5537de3.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/2aa49c055e03cceed634e8aad5537de3.th.jpg",
                caption: "我是真的很开心呀",
            },
            {
                type: "photo",
                id: "6498005e131ac7d7a96ff31b4bd7f2e5",
                title: "我立于百万生命之上 - 搞不懂！！感觉好恶心！！",
                photo_url: "https://image.pseudoyu.com/images/6498005e131ac7d7a96ff31b4bd7f2e5.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/6498005e131ac7d7a96ff31b4bd7f2e5.th.jpg",
                caption: "搞不懂！！感觉好恶心！！",
            },
            {
                type: "photo",
                id: "058006026c863932259e1a4d02dfbe33",
                title: "我立于百万生命之上 - 离职前的遭遇",
                photo_url: "https://image.pseudoyu.com/images/058006026c863932259e1a4d02dfbe33.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/058006026c863932259e1a4d02dfbe33.th.jpg",
                caption: "离职前的遭遇",
            },
            {
                type: "photo",
                id: "fdac40ca7c64de559aeafc7dd215558e",
                title: "我立于百万生命之上 - 谢谢你",
                photo_url: "https://image.pseudoyu.com/images/fdac40ca7c64de559aeafc7dd215558e.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/fdac40ca7c64de559aeafc7dd215558e.th.jpg",
                caption: "谢谢你",
            },
            {
                type: "photo",
                id: "99e31356e1da2c72da41362405cc0736",
                title: "无职转生 ～到了异世界就拿出真本事～ - 干杯",
                photo_url: "https://image.pseudoyu.com/images/99e31356e1da2c72da41362405cc0736.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/99e31356e1da2c72da41362405cc0736.th.jpg",
                caption: "干杯",
            },
            {
                type: "photo",
                id: "651259c08280bd5a386fe5790d8101a5",
                title: "无能的奈奈 - 我基本上都是变成动物在旁边看着",
                photo_url: "https://image.pseudoyu.com/images/651259c08280bd5a386fe5790d8101a5.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/651259c08280bd5a386fe5790d8101a5.th.jpg",
                caption: "我基本上都是变成动物在旁边看着",
            },
            {
                type: "photo",
                id: "9d29bc74b03d0cfb818131587f8f7e6b",
                title: "梦想成为魔法少女 - 是爱啊",
                photo_url: "https://image.pseudoyu.com/images/9d29bc74b03d0cfb818131587f8f7e6b.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/9d29bc74b03d0cfb818131587f8f7e6b.th.jpg",
                caption: "是爱啊",
            },
            {
                type: "photo",
                id: "5c39c13fa9e4c9b1b00682c0ff8be7aa",
                title: "睡觉的笨蛋 - 你一副很有内涵的样子，实际上肤浅的离谱",
                photo_url: "https://image.pseudoyu.com/images/5c39c13fa9e4c9b1b00682c0ff8be7aa.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/5c39c13fa9e4c9b1b00682c0ff8be7aa.th.jpg",
                caption: "你一副很有内涵的样子，实际上肤浅的离谱",
            },
            {
                type: "photo",
                id: "f5804d9ac2b37c20a408a4f6d4179517",
                title: "睡觉的笨蛋 - 渣渣圈理论",
                photo_url: "https://image.pseudoyu.com/images/f5804d9ac2b37c20a408a4f6d4179517.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/f5804d9ac2b37c20a408a4f6d4179517.th.jpg",
                caption: "渣渣圈理论",
            },
            {
                type: "photo",
                id: "99c7300a21188ffb8ac749bd08bdd02d",
                title: "药屋少女的呢喃 - 盯👀",
                photo_url: "https://image.pseudoyu.com/images/99c7300a21188ffb8ac749bd08bdd02d.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/99c7300a21188ffb8ac749bd08bdd02d.th.jpg",
                caption: "盯👀",
            },
            {
                type: "photo",
                id: "18ca0143364dda31778e7f770c93ef78",
                title: "葬送的芙莉莲 - 他进入龙的攻击范围了",
                photo_url: "https://image.pseudoyu.com/images/18ca0143364dda31778e7f770c93ef78.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/18ca0143364dda31778e7f770c93ef78.th.jpg",
                caption: "他进入龙的攻击范围了",
            },
            {
                type: "photo",
                id: "98514061816d35dffdb1b2b716fa8384",
                title: "葬送的芙莉莲 - 但我很害怕",
                photo_url: "https://image.pseudoyu.com/images/98514061816d35dffdb1b2b716fa8384.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/98514061816d35dffdb1b2b716fa8384.th.jpg",
                caption: "但我很害怕",
            },
            {
                type: "photo",
                id: "8f3f32a47e59270b9498db98bcb94c79",
                title: "葬送的芙莉莲 - 你在说什么呢？",
                photo_url: "https://image.pseudoyu.com/images/8f3f32a47e59270b9498db98bcb94c79.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/8f3f32a47e59270b9498db98bcb94c79.th.jpg",
                caption: "你在说什么呢？",
            },
            {
                type: "photo",
                id: "4fd69abc0cdef9ca35d222e542423e7b",
                title: "葬送的芙莉莲 - 快开门呀，眼镜男",
                photo_url: "https://image.pseudoyu.com/images/4fd69abc0cdef9ca35d222e542423e7b.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/4fd69abc0cdef9ca35d222e542423e7b.th.jpg",
                caption: "快开门呀，眼镜男",
            },
            {
                type: "photo",
                id: "71b5def9989ea2c49ecd08dae8398a84",
                title: "葬送的芙莉莲 - 握手",
                photo_url: "https://image.pseudoyu.com/images/71b5def9989ea2c49ecd08dae8398a84.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/71b5def9989ea2c49ecd08dae8398a84.th.jpg",
                caption: "握手",
            },
            {
                type: "photo",
                id: "92d48da4126f4b8a4d9f50a9401979bd",
                title: "葬送的芙莉莲 - 自裁吧，阿乌拉",
                photo_url: "https://image.pseudoyu.com/images/92d48da4126f4b8a4d9f50a9401979bd.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/92d48da4126f4b8a4d9f50a9401979bd.th.jpg",
                caption: "自裁吧，阿乌拉",
            },
            {
                type: "photo",
                id: "e9d10f2a804e85ec7e36e80bfdefc4be",
                title: "葬送的芙莉莲 - 这不也挺好的嘛",
                photo_url: "https://image.pseudoyu.com/images/e9d10f2a804e85ec7e36e80bfdefc4be.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/e9d10f2a804e85ec7e36e80bfdefc4be.th.jpg",
                caption: "这不也挺好的嘛",
            },
            {
                type: "photo",
                id: "da80d6cf86a80e48b7650d61b25b7b70",
                title: "葬送的芙莉莲 - 这不可能",
                photo_url: "https://image.pseudoyu.com/images/da80d6cf86a80e48b7650d61b25b7b70.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/da80d6cf86a80e48b7650d61b25b7b70.th.jpg",
                caption: "这不可能",
            },
            {
                type: "photo",
                id: "70847d933c484f5f5d65da221a17f225",
                title: "超人X - 不知道她知不知道毒品的事",
                photo_url: "https://image.pseudoyu.com/images/70847d933c484f5f5d65da221a17f225.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/70847d933c484f5f5d65da221a17f225.th.jpg",
                caption: "不知道她知不知道毒品的事",
            },
            {
                type: "photo",
                id: "164e89be4a557a65475ab45ee9c2638b",
                title: "超人X - 因为我想报恩",
                photo_url: "https://image.pseudoyu.com/images/164e89be4a557a65475ab45ee9c2638b.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/164e89be4a557a65475ab45ee9c2638b.th.jpg",
                caption: "因为我想报恩",
            },
            {
                type: "photo",
                id: "abdb0feffa60550b2d4a6bf37fbf63f0",
                title: "超人X - 就是我",
                photo_url: "https://image.pseudoyu.com/images/abdb0feffa60550b2d4a6bf37fbf63f0.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/abdb0feffa60550b2d4a6bf37fbf63f0.th.jpg",
                caption: "就是我",
            },
            {
                type: "photo",
                id: "23e38e5d535602e8911bd27eb1ef983f",
                title: "超超超超超喜欢你的100个女朋友 - 我已经，不想再工作了",
                photo_url: "https://image.pseudoyu.com/images/23e38e5d535602e8911bd27eb1ef983f.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/23e38e5d535602e8911bd27eb1ef983f.th.jpg",
                caption: "我已经，不想再工作了",
            },
            {
                type: "photo",
                id: "OOd96ad46c0f2c1d63",
                title: "链锯人 - OO脊髓剑",
                photo_url: "https://image.pseudoyu.com/images/OOd96ad46c0f2c1d63.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/OOd96ad46c0f2c1d63.th.jpg",
                caption: "OO脊髓剑",
            },
            {
                type: "photo",
                id: "cde2a663fecd5fdce7c3852e6bf7dfc0",
                title: "链锯人 - 万圣节",
                photo_url: "https://image.pseudoyu.com/images/cde2a663fecd5fdce7c3852e6bf7dfc0.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/cde2a663fecd5fdce7c3852e6bf7dfc0.th.jpg",
                caption: "万圣节",
            },
            {
                type: "photo",
                id: "39838c6a13364710749171d4df63e556",
                title: "链锯人 - 不要打了",
                photo_url: "https://image.pseudoyu.com/images/39838c6a13364710749171d4df63e556.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/39838c6a13364710749171d4df63e556.th.jpg",
                caption: "不要打了",
            },
            {
                type: "photo",
                id: "05e5bd7d6c891a58ebd8549c13f6064b",
                title: "链锯人 - 你哭什么啊（不准打雪仗）",
                photo_url: "https://image.pseudoyu.com/images/05e5bd7d6c891a58ebd8549c13f6064b.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/05e5bd7d6c891a58ebd8549c13f6064b.th.jpg",
                caption: "你哭什么啊（不准打雪仗）",
            },
            {
                type: "photo",
                id: "253e5bf26cad07e0c241690d53d7faee",
                title: "链锯人 - 在他们的余生中，除了万圣节，不会再去思考其他东西",
                photo_url: "https://image.pseudoyu.com/images/253e5bf26cad07e0c241690d53d7faee.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/253e5bf26cad07e0c241690d53d7faee.th.jpg",
                caption: "在他们的余生中，除了万圣节，不会再去思考其他东西",
            },
            {
                type: "photo",
                id: "9967c167998bf4d4c52973f7f758df1e",
                title: "链锯人 - 我想做爱",
                photo_url: "https://image.pseudoyu.com/images/9967c167998bf4d4c52973f7f758df1e.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/9967c167998bf4d4c52973f7f758df1e.th.jpg",
                caption: "我想做爱",
            },
            {
                type: "photo",
                id: "435188488536169138ac2a4b02380001",
                title: "链锯人 - 抱抱",
                photo_url: "https://image.pseudoyu.com/images/435188488536169138ac2a4b02380001.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/435188488536169138ac2a4b02380001.th.jpg",
                caption: "抱抱",
            },
            {
                type: "photo",
                id: "57c3cdecb7ae286fa7a222deab197309",
                title: "链锯人 - 王八蛋",
                photo_url: "https://image.pseudoyu.com/images/57c3cdecb7ae286fa7a222deab197309.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/57c3cdecb7ae286fa7a222deab197309.th.jpg",
                caption: "王八蛋",
            },
            {
                type: "photo",
                id: "8141b90c4d6d37f77a66b40c6d28dfd6",
                title: "链锯人 - 电锯驱动，亡命走单骑",
                photo_url: "https://image.pseudoyu.com/images/8141b90c4d6d37f77a66b40c6d28dfd6.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/8141b90c4d6d37f77a66b40c6d28dfd6.th.jpg",
                caption: "电锯驱动，亡命走单骑",
            },
            {
                type: "photo",
                id: "48e3a6044abd6dbc9b30c2f7a530df21",
                title: "链锯人 - 这不是你的男朋友吗？",
                photo_url: "https://image.pseudoyu.com/images/48e3a6044abd6dbc9b30c2f7a530df21.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/48e3a6044abd6dbc9b30c2f7a530df21.th.jpg",
                caption: "这不是你的男朋友吗？",
            },
            {
                type: "photo",
                id: "a4dc8c75d1bc1aa376c134ada3ad9105",
                title: "链锯人 - 鹰鹰诗",
                photo_url: "https://image.pseudoyu.com/images/a4dc8c75d1bc1aa376c134ada3ad9105.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/a4dc8c75d1bc1aa376c134ada3ad9105.th.jpg",
                caption: "鹰鹰诗",
            },
            {
                type: "photo",
                id: "OOO",
                title: "间谍过家家 - 没错，OOO会读心",
                photo_url: "https://image.pseudoyu.com/images/OOO.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/OOO.th.jpg",
                caption: "没错，OOO会读心",
            },
            {
                type: "photo",
                id: "848539076045ec6a8c35ad55230c9d64",
                title: "香格里拉·弗陇提亚～屎作猎人向神作发起挑战～ - 喷血",
                photo_url: "https://image.pseudoyu.com/images/848539076045ec6a8c35ad55230c9d64.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/848539076045ec6a8c35ad55230c9d64.th.jpg",
                caption: "喷血",
            },
            {
                type: "photo",
                id: "OOb6ad63d430359a79",
                title: "香格里拉·弗陇提亚～屎作猎人向神作发起挑战～ - 我很庆幸，第一次是给了OO",
                photo_url: "https://image.pseudoyu.com/images/OOb6ad63d430359a79.jpg",
                thumbnail_url: "https://image.pseudoyu.com/images/OOb6ad63d430359a79.th.jpg",
                caption: "我很庆幸，第一次是给了OO",
            },
        ];

        const query = update.inline_query.query
        let offset = update.inline_query.offset
        if (!offset) {offset = '0'}
        console.log(`Received inline query: ${query}, offset: ${offset}`)

        const results = await getResultsForQuery(query, all, offset);
        const nextOffset = calculateNextOffset(offset); // 计算下一页的offset

        await answerInlineQuery(queryId, results, nextOffset, env)

        return
    }

    if (content.startsWith('/getchatid')) {
        return await processGetGroupIdCommand(update, env)

    } else if (content.startsWith('/getuserid')) {
        return await processGetUserIdCommand(update, env)

    } else if (content.startsWith('/ping')) {
        return await processPingCommand(update, env)

    } else if (content.startsWith('/sync_twitter')) {
        return await twitter.processSyncTwitterCommand(update, env)

    } else if (content.startsWith('/search')) {
        return await processChannel(update, env)

    } else if (content.startsWith('/sync_xlog')) {
        return await processSyncXLogCommand(update, env)

    } else {
        return await processLLM(update, env)
    }
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        if (request.method === 'POST') {
            try {
                const update = await request.json() as TelegramUpdate
                await handleTelegramUpdate(update, env, async () => {
                    return await handler(update, env)
                })
            } catch (e) {
                console.log(e)
            }
            return new Response('Update processed')
        }
        return new Response('Expecting POST request')
    },
}
