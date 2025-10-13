import { STORAGE_KEYS } from "../constants";
import { isBrowser, safeJSONParse } from "../utils/guards";

const MASTER_ITERATIONS = 120_000;
const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

type EncryptedValue = {
  ciphertext: string;
  iv: string;
  updatedAt: number;
};

type SecureMap = Record<string, EncryptedValue>;

type Material = {
  baseKey: CryptoKey;
  salt: ArrayBuffer;
};

const bufferToBase64 = (buffer: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

const base64ToBuffer = (value: string) =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0)).buffer;

const readSecureMap = (): SecureMap => {
  if (!isBrowser()) return {};
  const raw = window.localStorage.getItem(STORAGE_KEYS.secureKV);
  return safeJSONParse<SecureMap>(raw, {});
};

const writeSecureMap = (map: SecureMap) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEYS.secureKV, JSON.stringify(map));
};

const ensureMaterial = async (): Promise<Material> => {
  if (!isBrowser()) throw new Error("Secure storage requires browser environment");
  const storedKey = window.localStorage.getItem(STORAGE_KEYS.secureMaster);
  const storedSalt = window.localStorage.getItem(STORAGE_KEYS.secureSalt);
  if (storedKey && storedSalt) {
    const baseKey = await crypto.subtle.importKey("raw", base64ToBuffer(storedKey), "PBKDF2", false, ["deriveKey"]);
    return { baseKey, salt: base64ToBuffer(storedSalt) };
  }
  return createMaterial();
};

const createMaterial = async (): Promise<Material> => {
  if (!isBrowser()) throw new Error("Secure storage requires browser environment");
  const baseKey = await crypto.subtle.generateKey({ name: "PBKDF2", length: 256 }, true, ["deriveKey"]);
  const exported = await crypto.subtle.exportKey("raw", baseKey);
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  window.localStorage.setItem(STORAGE_KEYS.secureMaster, bufferToBase64(exported));
  window.localStorage.setItem(STORAGE_KEYS.secureSalt, bufferToBase64(saltBytes.buffer));
  return { baseKey, salt: saltBytes.buffer };
};

const deriveMasterKey = async (material?: Material) => {
  const { baseKey, salt } = material ?? (await ensureMaterial());
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: MASTER_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

const encryptWith = async (masterKey: CryptoKey, plaintext: string) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, masterKey, ENCODER.encode(plaintext));
  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv.buffer),
    updatedAt: Date.now(),
  } satisfies EncryptedValue;
};

const decryptWith = async (masterKey: CryptoKey, value: EncryptedValue) => {
  const cipher = base64ToBuffer(value.ciphertext);
  const iv = new Uint8Array(base64ToBuffer(value.iv));
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, masterKey, cipher);
  return DECODER.decode(decrypted);
};

export const setSecureItem = async (key: string, value: string) => {
  if (!isBrowser()) throw new Error("Secure storage only available in browser");
  const material = await ensureMaterial();
  const masterKey = await deriveMasterKey(material);
  const map = readSecureMap();
  map[key] = await encryptWith(masterKey, value);
  writeSecureMap(map);
};

export const getSecureItem = async (key: string): Promise<string | null> => {
  if (!isBrowser()) return null;
  const map = readSecureMap();
  const entry = map[key];
  if (!entry) return null;
  try {
    const material = await ensureMaterial();
    const masterKey = await deriveMasterKey(material);
    return await decryptWith(masterKey, entry);
  } catch (error) {
    console.error("Failed to decrypt secure entry", error);
    return null;
  }
};

export const removeSecureItem = async (key: string) => {
  if (!isBrowser()) return;
  const map = readSecureMap();
  delete map[key];
  writeSecureMap(map);
};

export const clearSecureStore = async () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEYS.secureKV);
  window.localStorage.removeItem(STORAGE_KEYS.secureMaster);
  window.localStorage.removeItem(STORAGE_KEYS.secureSalt);
};

export const exportSecureStore = async () => {
  if (!isBrowser()) return null;
  return JSON.stringify(readSecureMap(), null, 2);
};

export const importSecureStore = async (json: string) => {
  if (!isBrowser()) throw new Error("Secure storage only available in browser");
  const map = safeJSONParse<SecureMap>(json, {});
  writeSecureMap(map);
};

export const rotateMasterKey = async () => {
  if (!isBrowser()) return;
  const currentMap = readSecureMap();
  const entries = Object.entries(currentMap);
  if (!entries.length) {
    await createMaterial();
    return;
  }
  const material = await ensureMaterial();
  const oldMaster = await deriveMasterKey(material);
  const decryptedEntries = await Promise.all(
    entries.map(async ([key, value]) => ({ key, plaintext: await decryptWith(oldMaster, value) }))
  );
  const newMaterial = await createMaterial();
  const newMaster = await deriveMasterKey(newMaterial);
  const nextMap: SecureMap = {};
  for (const entry of decryptedEntries) {
    nextMap[entry.key] = await encryptWith(newMaster, entry.plaintext);
  }
  writeSecureMap(nextMap);
};
