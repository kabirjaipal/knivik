import { Metadata } from "next";
import { constructPageMetadata, SchemaService, getBaseUrl, resolveUrl } from "@/lib/seo";
import { API_URL } from "@/lib/constants";
import { db } from "@/lib/db";

export interface Author {
  name: string;
  role: string;
  avatarUrl: string;
  twitter?: string;
  instagram?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  coverImage: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  author: Author;
}

export class BlogService {
  private static getApiUrl(): string {
    const isServer = typeof window === "undefined";
    const nextUrl = API_URL;
    
    if (isServer) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || "http://localhost:3000";
      if (nextUrl.startsWith("/")) {
        return `${siteUrl}${nextUrl}`;
      }
      return nextUrl;
    }
    
    return nextUrl;
  }

  /**
   * Retrieves all published blog posts sorted by date descending.
   */
  public static async getAllPosts(): Promise<BlogPost[]> {
    try {
      if (typeof window === "undefined") {
        const posts = await db.client.blogPost.findMany({
          where: { status: 'PUBLISHED' },
          orderBy: { date: 'desc' },
          include: {
            createdBy: {
              select: {
                username: true,
                displayUsername: true,
              },
            },
          },
        });
        return posts.map((post) => ({
          slug: post.slug,
          title: post.title,
          description: post.description,
          content: post.content,
          coverImage: post.coverImage,
          date: post.date.toISOString(),
          readTime: post.readTime,
          category: post.category,
          tags: post.tags,
          author: {
            name: post.createdBy?.displayUsername || post.createdBy?.username || "Knivik",
            role: "AI Buyer Intent SDR",
            avatarUrl: "",
            twitter: "https://x.com/knivikai",
            instagram: "https://instagram.com/knivikai",
          },
        }));
      }

      // ?published=true ensures drafts are never served publicly
      const res = await fetch(`${this.getApiUrl()}/blog?published=true`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("API response error");
      const data = await res.json();
      const posts: any[] = data.posts || [];
      const mappedPosts: BlogPost[] = posts.map(post => ({
        slug: post.slug,
        title: post.title,
        description: post.description,
        content: post.content,
        coverImage: post.coverImage,
        date: post.date,
        readTime: post.readTime,
        category: post.category,
        tags: post.tags || [],
        author: {
          name: "Knivik",
          role: "AI Buyer Intent SDR",
          avatarUrl: "",
          twitter: "https://x.com/knivikai",
          instagram: "https://instagram.com/knivikai",
        }
      }));
      return mappedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (err) {
      console.warn("⚠️ Blog fetch failed: ", err);
      return [];
    }
  }

  /**
   * Retrieves a blog post by its slug.
   */
  public static async getPostBySlug(slug: string): Promise<BlogPost | undefined> {
    try {
      if (typeof window === "undefined") {
        const post = await db.client.blogPost.findUnique({
          where: { slug },
          include: {
            createdBy: {
              select: {
                username: true,
                displayUsername: true,
              },
            },
          },
        });
        if (!post) return undefined;
        return {
          slug: post.slug,
          title: post.title,
          description: post.description,
          content: post.content,
          coverImage: post.coverImage,
          date: post.date.toISOString(),
          readTime: post.readTime,
          category: post.category,
          tags: post.tags,
          author: {
            name: post.createdBy?.displayUsername || post.createdBy?.username || "Knivik",
            role: "AI Buyer Intent SDR",
            avatarUrl: "",
            twitter: "https://x.com/knivikai",
            instagram: "https://instagram.com/knivikai",
          },
        };
      }

      const res = await fetch(`${this.getApiUrl()}/blog/${slug}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("API response error");
      const data = await res.json();
      if (!data.post) return undefined;
      return {
        ...data.post,
        author: {
          name: "Knivik",
          role: "AI Buyer Intent SDR",
          avatarUrl: "",
          twitter: "https://x.com/knivikai",
          instagram: "https://instagram.com/knivikai",
        }
      };
    } catch (err) {
      console.warn(`⚠️ Blog fetch failed for slug ${slug}: `, err);
      return undefined;
    }
  }

  /**
   * Retrieves all unique post categories.
   */
  public static async getAllCategories(): Promise<string[]> {
    try {
      const posts = await this.getAllPosts();
      const categories = posts.map((post) => post.category);
      return Array.from(new Set(categories));
    } catch {
      return [];
    }
  }

  /**
   * Generates SEO-optimized page metadata for a blog post.
   */
  public static async generateMetadata(slug: string): Promise<Metadata> {
    const post = await this.getPostBySlug(slug);
    
    if (!post) {
      return constructPageMetadata({
        title: "Knivik Blog",
        description: "Read the latest guides on social selling, buyer intent scoring, and growing your SaaS sales pipeline.",
        path: `/blog/${slug}`,
        noIndex: true,
      });
    }

    const ogImage = post.coverImage.startsWith("data:")
      ? `/api/blog/${post.slug}/image`
      : post.coverImage;

    return constructPageMetadata({
      title: `${post.title} - Blog`,
      description: post.description,
      path: `/blog/${post.slug}`,
      keywords: post.tags,
      ogImage,
      type: "article",
    });
  }

  /**
   * Generates BreadcrumbList JSON-LD schema for SEO navigation.
   */
  public static generateBreadcrumbsSchema(post: BlogPost): Record<string, any> {
    return SchemaService.generateBreadcrumbsSchema([
      { name: "Home", item: "/" },
      { name: "Blog", item: "/blog" },
      { name: post.title, item: `/blog/${post.slug}` },
    ]);
  }

  /**
   * Generates Article JSON-LD schema for search engines.
   */
  public static generateArticleSchema(post: BlogPost): Record<string, any> {
    const baseUrl = getBaseUrl();
    const dateStr = typeof post.date === 'string' ? post.date : new Date(post.date).toISOString().split('T')[0];
    const imageUrl = post.coverImage.startsWith("data:")
      ? resolveUrl(`/api/blog/${post.slug}/image`)
      : post.coverImage;
    const postUrl = resolveUrl(`/blog/${post.slug}`);
    
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.description,
      "image": imageUrl,
      "datePublished": dateStr,
      "dateModified": dateStr,
      "inLanguage": "en-US",
      "author": {
        "@type": "Person",
        "name": post.author?.name || "Knivik Growth Team",
        "jobTitle": post.author?.role || "B2B Sales Specialist",
        "sameAs": [
          post.author?.twitter,
          post.author?.instagram
        ].filter(Boolean)
      },
      "publisher": {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "Knivik",
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/favicon.svg`
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": postUrl
      }
    };
  }
}
