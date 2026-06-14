"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Save, Loader2, Sparkles, Upload, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import TiptapEditor from "@/components/admin/TiptapEditor";
import { calculateReadTime, compressImage } from "@/lib/utils";

type PostStatus = "DRAFT" | "PUBLISHED";

interface BlogPostFormProps {
  /** When provided the form runs in edit mode – fetches existing post and PUTs on save. */
  postId?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function BlogPostForm({ postId }: BlogPostFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(postId);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState<PostStatus | null>(null); // tracks which button is spinning

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [readTime, setReadTime] = useState("0 min read");
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [currentStatus, setCurrentStatus] = useState<PostStatus>("DRAFT");

  // Auto-calculate read time whenever content changes
  useEffect(() => {
    if (!content) return;
    setReadTime(calculateReadTime(content));
  }, [content]);

  // Fetch existing post data in edit mode
  useEffect(() => {
    if (!isEditMode || !postId) return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/blog/${postId}`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load blog post details");

        const data = await res.json();
        if (!data.success || !data.post) throw new Error(data.error || "Post not found");

        const post = data.post;
        setTitle(post.title);
        setSlug(post.slug);
        setDescription(post.description);
        setContent(post.content);
        setCoverImage(post.coverImage);
        setReadTime(post.readTime);
        setCategory(post.category);
        setTagsInput(post.tags ? post.tags.join(", ") : "");
        setCurrentStatus(post.status ?? "DRAFT");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load blog post";
        toast.error(message);
        router.push("/admin/blog");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, isEditMode, router]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    // Only auto-slugify when creating; in edit mode the slug is usually stable
    if (!isEditMode) setSlug(slugify(val));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      setCoverImage(base64);
      toast.success("Image uploaded & compressed successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to process image";
      console.error(err);
      toast.error(message);
    }
  };

  const handleSave = async (targetStatus: PostStatus) => {
    if (!title || !slug || !description || !content) {
      toast.error("Please fill in the title, slug, description, and content.");
      return;
    }

    if (!coverImage) {
      toast.error("Please upload a cover image.");
      return;
    }

    try {
      setSaving(targetStatus);

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = { title, slug, description, content, coverImage, readTime, category, tags, status: targetStatus };

      const url = isEditMode ? `${API_BASE}/blog/${postId}` : `${API_BASE}/blog`;
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save post");

      setCurrentStatus(targetStatus);

      const successMsg =
        targetStatus === "PUBLISHED"
          ? "Post published! It is now live on the blog."
          : "Draft saved. It is hidden from readers.";
      toast.success(successMsg);
      router.push("/admin/blog");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save blog post";
      console.error(err);
      toast.error(message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSavingDraft = saving === "DRAFT";
  const isSavingPublish = saving === "PUBLISHED";
  const isBusy = saving !== null;

  return (
    <div className="space-y-6 container pb-8">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="outline" size="icon-sm" type="button" asChild>
            <Link href="/admin/blog">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h2 className="text-xl font-black tracking-tight text-foreground truncate">
            {isEditMode ? "Edit Post" : "Create Post"}
          </h2>
          {/* Current status badge */}
          <Badge
            className={`shrink-0 text-[10px] font-black uppercase tracking-wider border-0 ${
              currentStatus === "PUBLISHED"
                ? "bg-success/15 text-success"
                : "bg-yellow-500/15 text-yellow-400"
            }`}
          >
            {currentStatus === "PUBLISHED" ? "● Live" : "● Draft"}
          </Badge>
        </div>

        {/* Dual action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={isBusy}
            onClick={() => handleSave("DRAFT")}
            className="font-bold gap-2"
          >
            {isSavingDraft ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {isSavingDraft ? "Saving…" : "Save Draft"}
          </Button>
          <Button
            variant="default"
            size="sm"
            type="button"
            disabled={isBusy}
            onClick={() => handleSave("PUBLISHED")}
            className="font-bold gap-2"
          >
            {isSavingPublish ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            {isSavingPublish
              ? "Publishing…"
              : currentStatus === "PUBLISHED"
              ? "Update & Keep Live"
              : "Publish Now"}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Article Body */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border/40 bg-card">
            <CardHeader className="px-5 pt-3 pb-2">
              <CardTitle className="text-base font-bold text-foreground">Article Body</CardTitle>
              <CardDescription>
                {isEditMode
                  ? "Edit and format your article's main content below."
                  : "Write and format your article's main content below."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <TiptapEditor value={content} onChange={setContent} />
            </CardContent>
          </Card>
        </div>

        {/* Right column: Post Settings & SEO */}
        <div className="space-y-6">
          <Card className="border-border/40 bg-card">
            <CardHeader className="px-5 pt-3 pb-2">
              <CardTitle className="text-base font-bold text-foreground">Post Settings & SEO</CardTitle>
              <CardDescription>Configure categorization, settings, and SEO meta tags.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Title</label>
                <input
                  type="text"
                  required
                  placeholder="How to Find B2B Sales Leads..."
                  value={title}
                  onChange={handleTitleChange}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Slug</span>
                  <button
                    type="button"
                    onClick={() => setSlug(slugify(title))}
                    className="text-[10px] text-primary hover:underline font-bold uppercase tracking-widest flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Regenerate
                  </button>
                </label>
                <input
                  type="text"
                  required
                  placeholder="how-to-find-b2b-leads-on-reddit"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                />
              </div>

              {/* Short Description */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Short Description (SEO Meta)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Discover the exact search operators and outreach strategies..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Category</label>
                <input
                  type="text"
                  required
                  placeholder="Lead Gen, Alternative Guides..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Reddit Marketing, Social Selling"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Cover Image</label>
                {coverImage ? (
                  <div className="relative w-full overflow-hidden rounded-md border border-border bg-muted/20 group" style={{ aspectRatio: "16/9" }}>
                    <img src={coverImage} alt="Cover Preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setCoverImage("")}
                        className="font-bold"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border border-dashed border-border rounded-md cursor-pointer bg-background hover:bg-muted/10 transition duration-200">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-foreground font-bold">Click to upload cover image</p>
                      <p className="text-xs text-muted-foreground mt-1">WebP, PNG, JPG (compressed client-side)</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>

              {/* Read Time */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Read Time (Auto-calculated)
                </label>
                <div className="w-full h-10 px-3 rounded-md border border-border bg-muted/30 text-muted-foreground flex items-center text-sm font-medium font-mono">
                  {readTime}
                </div>
              </div>

              {/* Status info box */}
              <div className={`rounded-md border p-3 text-xs leading-relaxed ${
                currentStatus === "PUBLISHED"
                  ? "border-success/30 bg-success/5 text-success"
                  : "border-yellow-500/30 bg-yellow-500/5 text-yellow-400"
              }`}>
                {currentStatus === "PUBLISHED" ? (
                  <><strong>Live</strong> — This post is publicly visible and indexed by search engines.</>
                ) : (
                  <><strong>Draft</strong> — Only admins can see this post. It won't appear on the blog or in SEO results until published.</>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
