const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'www.youtu.be',
]);

export function getYouTubeVideoId(value) {
  if (!value) return null;

  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || !YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;

    let videoId;
    if (url.hostname.endsWith('youtu.be')) {
      videoId = url.pathname.split('/').filter(Boolean)[0];
    } else if (url.pathname === '/watch') {
      videoId = url.searchParams.get('v');
    } else {
      videoId = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})(?:\/|$)/)?.[1];
    }

    return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}
