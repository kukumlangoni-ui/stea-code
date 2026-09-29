/**
 * R2 helpers using Cloudflare's native R2 binding.
 * Signed URLs are generated with AWS Signature Version 4 via Web Crypto.
 */

export interface R2UploadResult {
  key: string;
  etag: string;
  size: number;
}

/**
 * Upload a buffer/stream to the R2 bucket via the native binding.
 */
export async function putObject(
  bucket: R2Bucket,
  key: string,
  body: ArrayBuffer | ReadableStream | string,
  contentType: string
): Promise<R2UploadResult> {
  const result = await bucket.put(key, body as any, {
    httpMetadata: { contentType },
  });
  return {
    key,
    etag: result.etag || "",
    size: result.size ?? 0,
  };
}

/**
 * Check if an object exists in R2.
 */
export async function headObject(bucket: R2Bucket, key: string): Promise<{ exists: boolean; size: number }> {
  const obj = await bucket.head(key);
  if (!obj) return { exists: false, size: 0 };
  return { exists: true, size: obj.size };
}

// ============ AWS SigV4 Signed URL Generation ============

const HMAC_SHA256 = "HMAC";
const SHA256 = "SHA-256";

async function hmac(key: BufferSource | CryptoKey, data: string | ArrayBuffer): Promise<ArrayBuffer> {
  const cryptoKey =
    key instanceof CryptoKey
      ? key
      : await crypto.subtle.importKey("raw", key, { name: HMAC_SHA256, hash: SHA256 }, false, ["sign"]);
  const dataBytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  const sig = await crypto.subtle.sign(HMAC_SHA256, cryptoKey, dataBytes);
  return sig;
}

function buf2hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function sha256hex(data: string | ArrayBuffer): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  return crypto.subtle.digest(SHA256, bytes).then((buf) => buf2hex(buf));
}

/**
 * Generate a presigned download URL for an R2 object using AWS SigV4.
 *
 * R2 is S3-compatible, so we sign the request the same way as S3:
 *   host: {account-id}.r2.cloudflarestorage.com
 *   service: s3
 *   region: auto
 *
 * @param accountId - Cloudflare account ID
 * @param accessKeyId - R2 access key ID
 * @param secretAccessKey - R2 secret access key
 * @param bucket - R2 bucket name
 * @param key - Object key
 * @param expiresIn - URL lifetime in seconds (max 604800 / 7 days)
 */
export async function getSignedDownloadUrl(
  accountId: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  key: string,
  expiresIn: number = 300
): Promise<string> {
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const region = "auto";
  const service = "s3";
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const canonicalUri = `/${encodeURIComponent(bucket)}/${encodeURIComponent(key).replace(/%2F/g, "/")}`;

  const canonicalQuerystring = [
    `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
    `X-Amz-Credential=${encodeURIComponent(`${accessKeyId}/${dateStamp}/${region}/${service}/aws4_request`)}`,
    `X-Amz-Date=${amzDate}`,
    `X-Amz-Expires=${expiresIn}`,
    `X-Amz-SignedHeaders=host`,
  ].join("&");

  const payloadHash = "UNSIGNED-PAYLOAD";
  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = "host";

  const canonicalRequest = [
    "GET",
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256hex(canonicalRequest),
  ].join("\n");

  const kDate = await hmac(new TextEncoder().encode(`AWS4${secretAccessKey}`), dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, "aws4_request");
  const signature = buf2hex(await hmac(kSigning, stringToSign));

  const url = `https://${host}${canonicalUri}?${canonicalQuerystring}&X-Amz-Signature=${signature}`;
  return url;
}
