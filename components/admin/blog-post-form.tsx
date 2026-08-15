"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Save, Loader2, Sparkles, Upload, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import TiptapEditor from "@/components/admin/tiptap-editor";
import { calculateReadTime, compressImage } from "@/lib/utils";
import { API_URL } from "@/lib/constants";

type PostStatus = "DRAFT" | "PUBLISHED";

interface BlogPostFormProps {
  /** When provided the form runs in edit mode – fetches existing post and PUTs on save. */
  postId?: string;
}

const API_BASE = API_URL;

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
      <div className="grid gap-6 lg:grid-cols-3 items-stretch">
        {/* Left column: Article Body */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="border-border/40 bg-card flex-1 flex flex-col">
            <CardHeader className="px-5 pt-3 pb-2">
              <CardTitle className="text-base font-bold text-foreground">Article Body</CardTitle>
              <CardDescription>
                {isEditMode
                  ? "Edit and format your article's main content below."
                  : "Write and format your article's main content below."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 flex-1 flex flex-col">
              <TiptapEditor value={content} onChange={setContent} />
            </CardContent>
          </Card>
        </div>

        {/* Right column: Post Settings & SEO */}
        <div className="lg:col-span-1 flex flex-col">
          <Card className="border-border/40 bg-card flex-1 flex flex-col">
            <CardHeader className="px-5 pt-3 pb-2">
              <CardTitle className="text-base font-bold text-foreground flex items-center justify-between">
                <span>Post Settings & SEO</span>
                <Badge variant="secondary" className="text-[10px] font-mono font-bold uppercase tracking-wider py-0.5">
                  {readTime}
                </Badge>
              </CardTitle>
              <CardDescription>Configure categorization, settings, and SEO meta tags.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 flex-1 flex flex-col space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Title</label>
                <input
                  type="text"
                  required
                  placeholder="How to Find B2B Sales Leads..."
                  value={title}
                  onChange={handleTitleChange}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-xs sm:text-sm"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1">
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
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono text-xs"
                />
              </div>

              {/* Short Description */}
              <div className="space-y-1 flex-1 flex flex-col min-h-[140px]">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Short Description (SEO Meta)
                </label>
                <textarea
                  required
                  placeholder="Discover the exact search operators and outreach strategies..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full flex-grow p-3 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none text-xs"
                />
              </div>

              {/* Category & Tags Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="Lead Gen"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-xs"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Tags</label>
                  <input
                    type="text"
                    placeholder="SEO, Sales"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-xs"
                  />
                </div>
              </div>

              {/* Cover Image */}
              <div className="space-y-1.5 flex-1 flex flex-col max-h-[300px]">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Cover Image</label>
                {coverImage ? (
                  <div className="relative flex-1 min-h-[120px] w-full rounded-md border border-border overflow-hidden bg-muted/10">
                    <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                    
                    {/* Delete button (Top Right) */}
                    <button
                      type="button"
                      onClick={() => setCoverImage("")}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-destructive text-white rounded-full backdrop-blur-sm transition-colors duration-200 border border-border/20 shadow-md"
                      title="Remove Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Change button / indicator (Bottom Right) */}
                    <label className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1 bg-black/70 hover:bg-background/90 text-foreground hover:text-primary border border-border/30 rounded text-[10px] font-black uppercase tracking-wider cursor-pointer backdrop-blur-sm transition-colors duration-200 shadow-md">
                      <Upload className="w-3 h-3" />
                      <span>Change</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                ) : (
                  <label className="flex-1 flex flex-col items-center justify-center gap-2 min-h-[120px] w-full border border-dashed border-border rounded-md cursor-pointer bg-background hover:bg-muted/10 transition duration-200 p-4">
                    <div className="p-2 rounded-full bg-muted/20 border border-border/50">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-0.5">
                      <span className="text-xs text-foreground font-black block">Select Cover Image</span>
                      <span className="text-[10px] text-muted-foreground block">PNG, JPG up to 5MB</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
