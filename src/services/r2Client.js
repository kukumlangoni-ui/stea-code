/**
 * Cloudflare R2 client for STEA Code asset storage.
 *
 * R2 is S3-compatible, so we use the AWS SDK v3. Credentials come from
 * environment variables (set locally in .env, in production via Firebase
 * Functions secrets).
 *
 * Bucket layout:
 *   products/{productId}/packages/{filename}.zip
 *   products/{productId}/preview/preview.{mp4,webm}
 *   products/{productId}/preview/poster.{jpg,png}
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client = null;

function getClient() {
  if (client) return client;

  const accessKeyId = process.env.R2_ACCESS_KEY_ID || import.meta.env?.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || import.meta.env?.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT || import.meta.env?.R2_ENDPOINT;

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    return null;
  }

  client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    // R2 does not use path-style or virtual-hosted style differently; force
    // path-style so the bucket name is part of the path.
    forcePathStyle: true,
  });

  return client;
}

function getBucket() {
  return process.env.R2_BUCKET_NAME || import.meta.env?.R2_BUCKET_NAME || "steacode";
}

export function isR2Configured() {
  return getClient() !== null;
}

/**
 * Upload a buffer to R2.
 * @param {string} key - Storage key (e.g. "products/abc/packages/v1.zip")
 * @param {Buffer} buffer - File bytes
 * @param {string} contentType - MIME type
 * @returns {Promise<{key: string, etag: string, size: number}>}
 */
export async function uploadAsset(key, buffer, contentType) {
  const s3 = getClient();
  if (!s3) throw new Error("R2 is not configured. Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT.");

  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  const result = await s3.send(command);
  return {
    key,
    etag: result.ETag,
    size: buffer.length,
  };
}

/**
 * Generate a presigned download URL (GET) for a private asset.
 * @param {string} key
 * @param {number} expiresIn - Seconds (default 300 = 5 min)
 * @returns {Promise<string>}
 */
export async function getSignedDownloadUrl(key, expiresIn = 300) {
  const s3 = getClient();
  if (!s3) throw new Error("R2 is not configured.");

  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Get the public URL for an asset (only works if the bucket has a public
 * domain configured). Returns empty string if no public URL is set.
 */
export function getPublicUrl(key) {
  const publicUrl = process.env.R2_PUBLIC_URL || import.meta.env?.R2_PUBLIC_URL || "";
  if (!publicUrl) return "";
  const base = publicUrl.endsWith("/") ? publicUrl : `${publicUrl}/`;
  return `${base}${key}`;
}

/**
 * Delete an asset from R2.
 */
export async function deleteAsset(key) {
  const s3 = getClient();
  if (!s3) throw new Error("R2 is not configured.");

  const command = new DeleteObjectCommand({
    Bucket: getBucket(),
    Key: key,
  });

  await s3.send(command);
  return { key, deleted: true };
}

/**
 * Check if an object exists in R2 and return its metadata.
 */
export async function headAsset(key) {
  const s3 = getClient();
  if (!s3) throw new Error("R2 is not configured.");

  try {
    const command = new HeadObjectCommand({
      Bucket: getBucket(),
      Key: key,
    });
    const result = await s3.send(command);
    return {
      exists: true,
      contentType: result.ContentType,
      size: result.ContentLength,
      lastModified: result.LastModified,
    };
  } catch (e) {
    if (e?.name === "NotFound" || e?.$metadata?.httpStatusCode === 404) {
      return { exists: false };
    }
    throw e;
  }
}
