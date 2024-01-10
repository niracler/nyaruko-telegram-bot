import { ipfsUploadFile } from "crossbell/ipfs"
import { Env } from "./type";

export async function uploadMediaToXLog(mediaData: ArrayBuffer): Promise<string> {
    const file = new File([mediaData], "mediaData")
    return (await ipfsUploadFile(file)).url
}

export async function createShort(title: string, content: string, attachmentUrlList: string[], env: Env): Promise<any> {
    const characterId = 57410
    const url = `https://indexer.crossbell.io/v1/siwe/contract/characters/${characterId}/notes`

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${env.XLOG_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            metadata: {
                tags: ["short"],
                type: "note",
                title,
                content,
                summary: "",
                sources: ["xlog"],
                date_published: new Date().toISOString(),
                attributes: [
                    {
                        // random with timestamp
                        value: `${Date.now()}`,
                        trait_type: "xlog_slug",
                    },
                ],
                attachments: attachmentUrlList.map(url => ({
                    name: "image",
                    address: url,
                    mime_type: "image/png",
                })),
            }
        }),
    })

    return await response.json()
}
