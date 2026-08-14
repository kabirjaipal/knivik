export const PROJECT_NAME = "Knivik";
export const PROJECT_DESCRIPTION = "Advanced AI social intelligence to find high-intent buyers across Reddit, HackerNews, Twitter, GitHub, and Bluesky. Turn online conversations into warm leads automatically.";
export const PROJECT_URL = process.env.NEXT_PUBLIC_SITE_URL as string;
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
export const SEARCH_PLATFORMS = ["Reddit", "HackerNews", "Twitter", "GitHub", "Bluesky"];

export enum UserPlan {
  FREE = "FREE",
  PRO = "PRO",
}
