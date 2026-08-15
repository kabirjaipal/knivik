import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Sparkles } from "lucide-react";
import { FaTwitter, FaInstagram } from "react-icons/fa";
import { BlogService } from "@/lib/blog/application/blog.service";
import { SchemaScript } from "@/components/seo/schema-script";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await BlogService.getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  return BlogService.generateMetadata(resolvedParams.slug);
}

export default async function BlogPostPage({ params }: PageProps) {
  const resolvedParams = await params;
  const post = await BlogService.getPostBySlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  const allPosts = await BlogService.getAllPosts();
  const relatedPosts = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  const breadcrumbsSchema = BlogService.generateBreadcrumbsSchema(post);
  const articleSchema = BlogService.generateArticleSchema(post);
  const authorInitials = (post.author?.name || "Knivik").slice(0, 2).toUpperCase();

  return (
    <article className="relative w-full bg-background text-foreground">
      <SchemaScript schema={breadcrumbsSchema} id={`schema-breadcrumbs-${post.slug}`} />
      <SchemaScript schema={articleSchema} id={`schema-article-${post.slug}`} />
      
      {/* Hero Header with Background Cover Image */}
      <div
        className="relative w-full flex flex-col justify-end pt-20 pb-12 mt-[88px] bg-background h-[320px] sm:h-[400px] md:h-[480px] overflow-hidden"
      >
        {/* Full width cover image with LCP prioritization */}
        <img
          src={post.coverImage}
          alt={post.title}
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
          loading="eager"
          decoding="async"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30 z-10" />

        <div className="container mx-auto px-6 relative z-20">
          {/* Back Link / Breadcrumb */}
          <div className="mb-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-xs font-bold text-white hover:text-primary transition-colors group bg-black/40 backdrop-blur-sm px-3.5 py-1.5 rounded-full"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Back to Articles
            </Link>
          </div>

          {/* Header Section */}
          <header className="space-y-4">
            <Badge className="bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 text-primary-foreground border-0 shadow">
              {post.category}
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white drop-shadow-md">
              {post.title}
            </h1>

            <p className="text-sm sm:text-base text-white/95 leading-relaxed max-w-3xl drop-shadow-sm">
              {post.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-3 text-[11px] font-bold text-white/80 pb-6 w-full">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full border border-white/20 bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black uppercase shrink-0">
                  {authorInitials}
                </div>
                <span>By {post.author.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={new Date(post.date).toISOString()}>
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.readTime}</span>
              </div>
              
              <div className="flex items-center gap-3 md:ml-auto">
                {post.author.twitter && (
                  <a
                    href={post.author.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Twitter Profile"
                    className="text-white/80 hover:text-primary transition-colors p-1"
                  >
                    <FaTwitter className="h-4 w-4" />
                  </a>
                )}
                {post.author.instagram && (
                  <a
                    href={post.author.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram Profile"
                    className="text-white/80 hover:text-primary transition-colors p-1"
                  >
                    <FaInstagram className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </header>
        </div>
      </div>

      {/* Main body content */}
      <div className="container mx-auto px-6 pt-12 pb-8 max-w-4xl">
        <div
          className="blog-prose pb-8 border-b border-border/40"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* E-E-A-T Author Profile Card */}
        <section className="my-10 rounded-2xl border border-border/60 bg-secondary/10 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/20 border border-primary/40 text-primary flex items-center justify-center text-sm font-black uppercase shrink-0">
            {authorInitials}
          </div>
          <div className="space-y-1 flex-1">
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              Written by {post.author.name}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Specialist at Knivik focusing on conversational B2B prospecting, social listening workflows, and AI buying intent detection.
            </p>
          </div>
        </section>

        {/* High-Converting In-Content CTA Box */}
        <section className="my-10 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-black text-foreground mb-2">
            Automate Your Lead Discovery Today
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed">
            Stop manually hunting keywords. Let Knivik’s AI scan Reddit, HackerNews, and X (Twitter) for active buyers 24/7.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button size="sm" className="h-10 px-6 text-xs font-black rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                Get Started Free ($0 / mo)
              </Button>
            </Link>
            <Link href="/tools">
              <Button variant="outline" size="sm" className="h-10 px-6 text-xs font-bold rounded-lg border-border/80">
                Explore Free Sales Tools
              </Button>
            </Link>
          </div>
        </section>

        {/* Related Articles Internal Link Cluster */}
        {relatedPosts.length > 0 && (
          <section className="my-12 pt-8 border-t border-border/40" aria-label="Related Articles">
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">
              Related Articles & Growth Guides
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="rounded-xl border border-border/60 bg-background/50 p-4 hover:border-primary/40 hover:bg-secondary/10 transition-all flex flex-col justify-between"
                >
                  <div>
                    <Badge variant="outline" className="text-[9px] uppercase font-black mb-2 border-border/60 text-muted-foreground">
                      {r.category}
                    </Badge>
                    <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 mb-1">
                      {r.title}
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-primary mt-3 inline-flex items-center gap-1">
                    Read guide →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
