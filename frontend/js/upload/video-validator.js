const allowedTypes = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const allowedExtensions = /\.(mp4|mov|webm)$/i;
export function validateVideo(file, maxBytes = 250 * 1024 * 1024) {
  if (!file) return { valid:false, message:"Choose a video file first." };
  const supported = allowedTypes.has(file.type) || allowedExtensions.test(file.name);
  if (!supported) return { valid:false, message:"Use an MP4, MOV, or WebM video." };
  if (file.size > maxBytes) return { valid:false, message:"The video must be 250 MB or smaller." };
  if (file.size === 0) return { valid:false, message:"This file is empty." };
  return { valid:true, message:"Video format and size look good." };
}
