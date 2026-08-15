export class EnvConfig {
  private static readonly fallbackUrl = "https://www.knivik.xyz";

  /**
   * Retrieves the absolute base URL of the site with strong validation.
   * Ensures trailing slashes are removed for canonical reliability.
   */
  public static getBaseUrl(): string {
    const rawUrl = process.env.NEXT_PUBLIC_SITE_URL;
    
    if (!rawUrl) {
      return this.fallbackUrl;
    }

    try {
      return new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`).origin;
    } catch {
      return this.fallbackUrl;
    }
  }

  /**
   * Constructs an absolute URL for a given path.
   * Ensures the path prefix is formatted correctly.
   */
  public static resolveUrl(path: string): string {
    const baseUrl = this.getBaseUrl();
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    // If it's the home root, return just the base URL
    if (cleanPath === "/") {
      return baseUrl;
    }
    return `${baseUrl}${cleanPath}`;
  }
}
