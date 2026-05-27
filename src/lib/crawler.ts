const CRAWLER_USER_AGENT_PATTERN =
  /googlebot|google-inspectiontool|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebot|ia_archiver|twitterbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterestbot|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot/i;

export function isSearchEngineCrawler(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return CRAWLER_USER_AGENT_PATTERN.test(userAgent);
}
