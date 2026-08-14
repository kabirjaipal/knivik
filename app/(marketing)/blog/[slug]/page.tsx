import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Sparkles } from "lucide-react";
import { FaTwitter, FaInstagram } from "react-icons/fa";
import { BlogService } from "@/lib/blog/application/blog.service";
import { SchemaScript } from "@/components/seo/schema-script";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { Badge } from "@/components/ui/badge";

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

  const breadcrumbsSchema = BlogService.generateBreadcrumbsSchema(post);
  const articleSchema = BlogService.generateArticleSchema(post);

  return (
    <article className="relative w-full bg-background text-foreground">
      <SchemaScript schema={breadcrumbsSchema} id={`schema-breadcrumbs-${post.slug}`} />
      <SchemaScript schema={articleSchema} id={`schema-article-${post.slug}`} />
      {/* Hero Header with Background Cover Image */}
      <div
        className="relative w-full flex flex-col justify-end pt-20 pb-12 mt-[88px] bg-background h-[320px] sm:h-[400px] md:h-[480px] overflow-hidden"
      >
        {/* Full width cover image */}
        <img
          src={post.coverImage}
          alt={post.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30 z-10" />

        <div className="container mx-auto px-6 relative z-20">
          {/* Back Link */}
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
                  {post.author.name.split(" ").map(n => n[0]).join("")}
                </div>
                <span>By {post.author.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </div>
              
              <div className="flex items-center gap-3 md:ml-auto">
                {post.author.twitter && (
                  <a
                    href={post.author.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
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

      {/* Main body content without max-w constraint */}
      <div className="container mx-auto px-6 pt-12 pb-4">
        <div
          className="blog-prose pb-4"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </article>
  );
}
