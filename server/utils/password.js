import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);

const KEYLEN = 64;

export async function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = await scrypt(password, salt, KEYLEN);
    return `scrypt$${salt}$${Buffer.from(derivedKey).toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
    if (!storedHash || typeof storedHash !== "string") return false;

    const parts = storedHash.split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") {
        return false;
    }

    const [, salt, hashHex] = parts;
    const derivedKey = await scrypt(password, salt, KEYLEN);
    const hashBuffer = Buffer.from(hashHex, "hex");

    if (hashBuffer.length !== Buffer.from(derivedKey).length) {
        return false;
    }

    return timingSafeEqual(hashBuffer, Buffer.from(derivedKey));
}
