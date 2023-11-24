import { createHash } from "crypto";

export function sha256(text:string) {
    const hash = createHash('sha256')
    hash.update(text);
    return hash.digest('hex')
}