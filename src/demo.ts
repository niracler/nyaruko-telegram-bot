import OAuth from 'oauth-1.0a';
import { HmacSHA1, enc } from 'crypto-js';

async function main() {
    const oauth = new OAuth({
        consumer: { key: "Dw1Y5rFArSPQoBqU0t1JP0aT6", secret: "IvH89D2MDsW4tAoyYAEcWYDOZhkeXTv5u8rKicxmZt1WvEaoGC" },
        signature_method: 'HMAC-SHA1',
        hash_function(baseString, key) {
            return HmacSHA1(baseString, key).toString(enc.Base64);
        },
    });

    const oauthToken = {
        key: "990922055649378304-59n0v2LfUg3QcKZqz9Ta8lMUxyuRiCe",
        secret: "Jof03gmPMDl9aHdutWTup0uhKo7lb3M1kJijdxhH9uSKS",
    };

    const requestData = {
        url: 'https://api.twitter.com/1.1/statuses/update.json',
        method: 'POST',
        data: { status: 'Hello from Cloudflare worker' },
    };

    const response = await fetch(requestData.url, {
        method: requestData.method,
        headers: {
            ...oauth.toHeader(oauth.authorize(requestData, oauthToken)),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(requestData.data),
    });

    console.log(await response.json());
}

main();
