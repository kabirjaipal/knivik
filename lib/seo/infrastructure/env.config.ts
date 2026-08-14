export class EnvConfig {
  private static readonly fallbackUrl = "https://knivik.xyz";

  /**
   * Retrieves the absolute base URL of the site with strong validation.
   * Ensures trailing slashes are removed for canonical reliability.
   */
  public static getBaseUrl(): string {
    const rawUrl = process.env.NEXT_PUBLIC_SITE_URL;
    
    if (!rawUrl) {
      // In production environments, we want a strict fallback or log, but must avoid breaking compilation.
      return this.fallbackUrl;
    }

    try {
      const parsed = new URL(rawUrl);
      // Strip trailing slash if present
      return parsed.origin;
    } catch (error) {
      console.warn(
        `[SEO Engine warning]: Invalid NEXT_PUBLIC_SITE_URL environment variable "${rawUrl}". Falling back to "${this.fallbackUrl}". Error:`,
        error
      );
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
