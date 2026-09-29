/**
 * Utility to handle YouTube URL conversions to embed format
 * Supports youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, etc.
 */
export function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  
  // Standard Watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  // Short URL: https://youtu.be/VIDEO_ID
  // Embed URL: https://www.youtube.com/embed/VIDEO_ID
  
  let videoId = '';
  
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      videoId = match[2];
    } else {
      // Fallback for some edge cases
      const urlObj = new URL(url);
      if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.searchParams.has('v')) {
        videoId = urlObj.searchParams.get('v');
      }
    }
  } catch {
    // console.error("Invalid YouTube URL:", url);
  }
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  return url; // Return original if couldn't convert
}

/**
 * Get YouTube thumbnail from video ID or URL
 */
export function getYouTubeThumbnail(url, quality = 'maxresdefault') {
  if (!url) return '';
  
  const embedUrl = getYouTubeEmbedUrl(url);
  const videoId = embedUrl.split('/').pop();
  
  if (videoId) {
    // qualities: default, mqdefault, hqdefault, sddefault, maxresdefault
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
  }
  
  return '';
}
