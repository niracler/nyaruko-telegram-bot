import { Env, uploadPhotosToXLog } from "../src/xlog"
import { createShort } from "../src/xlog";

// 本地读取一张图片

async function main() {
    const env = {
        XLOG_TOKEN: process.env.XLOG_TOKEN,
        XLOG_CHARACTER_ID: "57410"
    } as Env
    const res = await uploadPhotosToXLog([
        "https://img3.doubanio.com/view/subject/s/public/s27207923.jpg"
    ], env)
    console.log(res)

    const res2 = await createShort("很好很好", "测试成功", res, env)
    console.log(res2)

    return
}

main().catch(console.error).then(console.log)
