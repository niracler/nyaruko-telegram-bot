import { Env } from "../src/core/type";
import { uploadMediaToXLog, createShort } from "../src/xlog";
import { readFileSync } from "fs";

// 本地读取一张图片

async function main() {
    const mediaData = readFileSync("/Users/niracler/Downloads/2023-12-31 22.49.57.png")
    const env = {
        XLOG_TOKEN: "...",
    } as Env
    const res = await uploadMediaToXLog(mediaData)
    console.log(res)

    const res2 = await createShort("很好很好", "测试成功", [res], env)
    console.log(res2)

    return
}

main().catch(console.error).then(console.log)
