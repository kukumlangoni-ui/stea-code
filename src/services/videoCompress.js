/**
 * Client-side video compression using ffmpeg.wasm.
 * Reduces video file size by ~80% before uploading to the
 * server, avoiding Cloudflare Worker memory limits.
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance = null;
let ffmpegLoadPromise = null;

async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoadPromise) return ffmpegLoadPromise;

  ffmpegLoadPromise = (async () => {
    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return ffmpegLoadPromise;
}

/**
 * Compress a video file. Returns a Blob.
 * @param {File} file - The original video file.
 * @param {(percent: number) => void} onProgress - Progress callback (0-100).
 * @returns {Promise<Blob>} Compressed MP4 blob.
 */
export async function compressVideo(file, onProgress) {
  const ffmpeg = await getFFmpeg();

  const handleProgress = ({ progress }) => {
    if (typeof progress === "number" && progress > 0 && progress <= 1) {
      onProgress?.(Math.round(progress * 100));
    }
  };
  ffmpeg.on("progress", handleProgress);

  try {
    const inputName = "input" + (file.name.match(/\.(mp4|webm|mov)$/i)?.[0] || ".mp4");
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    await ffmpeg.exec([
      "-i", inputName,
      "-vf", "scale='min(1280,iw)':-2",
      "-c:v", "libx264",
      "-crf", "28",
      "-preset", "fast",
      "-c:a", "aac",
      "-b:a", "96k",
      "-movflags", "+faststart",
      "output.mp4",
    ]);

    const data = await ffmpeg.readFile("output.mp4");
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile("output.mp4").catch(() => {});

    return new Blob([data.buffer], { type: "video/mp4" });
  } finally {
    ffmpeg.off("progress", handleProgress);
  }
}

/**
 * Convenience: compress and return a File with the same name
 * so the upload function receives an object shaped like the
 * original.
 */
export async function compressVideoToFile(file, onProgress) {
  const blob = await compressVideo(file, onProgress);
  return new File([blob], file.name.replace(/\.(webm|mov)$/i, ".mp4"), {
    type: "video/mp4",
  });
}
