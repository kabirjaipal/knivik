import { Metadata } from "next";
import { BlogPost } from "../domain/blog.model";

import { MetadataService } from "@/lib/seo/application/metadata.service";
import { SchemaService } from "@/lib/seo/application/schema.service";
import { EnvConfig } from "@/lib/seo/infrastructure/env.config";
import { API_URL } from "@/lib/constants";

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
   * Retrieves all blog posts sorted by date descending.
   */
  public static async getAllPosts(): Promise<BlogPost[]> {
    try {
      // ?published=true ensures drafts are never served publicly
      const res = await fetch(`${this.getApiUrl()}/blog?published=true`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("API response error");
      const data = await res.json();
      const posts: any[] = data.posts || [];
      const mappedPosts: BlogPost[] = posts.map(post => ({
        ...post,
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
      console.warn("⚠️ Blog API fetch failed: ", err);
      return [];
    }
  }

  /**
   * Retrieves a blog post by its slug.
   */
  public static async getPostBySlug(slug: string): Promise<BlogPost | undefined> {
    try {
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
      console.warn(`⚠️ Blog API fetch failed for slug ${slug}: `, err);
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
    } catch (err) {
      return [];
    }
  }

  /**
   * Generates SEO-optimized page metadata for a blog post.
   */
  public static async generateMetadata(slug: string): Promise<Metadata> {
    const post = await this.getPostBySlug(slug);
    
    if (!post) {
      return MetadataService.constructPageMetadata({
        title: "Knivik Blog",
        description: "Read the latest guides on social selling, buyer intent scoring, and growing your SaaS sales pipeline.",
        path: `/blog/${slug}`,
        noIndex: true,
      });
    }

    const ogImage = post.coverImage.startsWith("data:")
      ? `/api/blog/${post.slug}/image`
      : post.coverImage;

    return MetadataService.constructPageMetadata({
      title: `${post.title} | Knivik Blog`,
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
    const dateStr = typeof post.date === 'string' ? post.date : new Date(post.date).toISOString().split('T')[0];
    const imageUrl = post.coverImage.startsWith("data:")
      ? EnvConfig.resolveUrl(`/api/blog/${post.slug}/image`)
      : post.coverImage;
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.description,
      "image": imageUrl,
      "datePublished": dateStr,
      "dateModified": dateStr,
      "author": {
        "@type": "Person",
        "name": post.author?.name || "Admin",
        "jobTitle": post.author?.role || "Team",
        "sameAs": [
          post.author?.twitter,
          post.author?.instagram
        ].filter(Boolean)
      },
      "publisher": {
        "@type": "Organization",
        "name": "Knivik",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.knivik.xyz/logo.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://www.knivik.xyz/blog/${post.slug}`
      }
    };
  }
}
