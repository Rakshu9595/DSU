export function showVideoPreview(video, file) {
  const previous = video.dataset.objectUrl;
  if (previous) URL.revokeObjectURL(previous);
  const url = URL.createObjectURL(file);
  video.dataset.objectUrl = url;
  video.src = url;
  video.hidden = false;
  video.load();
}
