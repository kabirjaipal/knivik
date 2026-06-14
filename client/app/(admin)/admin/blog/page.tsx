"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Search,
  Tag,
  FolderOpen,
  Calendar,
  Edit2,
  Trash2,
  Loader2,
  FileText,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  createdBy?: {
    username: string;
    displayUsername?: string | null;
  };
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.status === "PUBLISHED").length;
  const draftPosts = posts.filter((p) => p.status === "DRAFT").length;

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/blog`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch blog posts");
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts || []);
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err: any) {
      console.error("Fetch blog posts error:", err);
      toast.error(err.message || "Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the blog post "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/blog/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Blog post deleted successfully");
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } else {
        throw new Error(data.error || "Failed to delete post");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete blog post");
    }
  };

  // Filter posts based on search query
  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Consolidate Header & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-foreground">Blog Articles</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Draft, schedule, and publish search-optimized guides.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-xs rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-0"
            />
          </div>
          <Button variant="default" size="sm" className="font-bold gap-2 h-9" asChild>
            <Link href="/admin/blog/create">
              <Plus className="w-4 h-4" /> Create Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Compact Stats Grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-3xl">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card/50">
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-black">Total Articles</p>
            <p className="text-base font-black text-foreground">{totalPosts}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card/50">
          <div className="p-2 rounded-md bg-success/10 text-success">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-black">Live & Public</p>
            <p className="text-base font-black text-foreground">{publishedPosts}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card/50">
          <div className="p-2 rounded-md bg-yellow-500/10 text-yellow-500">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-black">Drafts</p>
            <p className="text-base font-black text-foreground">{draftPosts}</p>
          </div>
        </div>
      </div>

      {/* Simplified Table listing */}
      <Card className="border-border/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/10 hover:bg-muted/10">
              <TableHead className="font-bold text-xs">Article Details</TableHead>
              <TableHead className="font-bold text-xs">Status</TableHead>
              <TableHead className="font-bold text-xs">Category</TableHead>
              <TableHead className="font-bold text-xs">Published Date</TableHead>
              <TableHead className="font-bold text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.map((post) => (
              <TableRow key={post.id} className="hover:bg-muted/5">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-foreground line-clamp-1">
                      {post.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                      /blog/{post.slug}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`text-[9px] font-black uppercase tracking-wider border-0 ${
                      post.status === "PUBLISHED"
                        ? "bg-success/15 text-success"
                        : "bg-yellow-500/15 text-yellow-400"
                    }`}
                  >
                    {post.status === "PUBLISHED" ? "● Live" : "● Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-black uppercase tracking-widest text-[9px]">
                    {post.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-2">
                    <Button variant="outline" size="icon-sm" title="Edit Article" asChild>
                      <Link href={`/admin/blog/edit/${post.id}`}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => handleDelete(post.id, post.title)}
                      title="Delete Article"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredPosts.length === 0 && (
          <div className="p-12 text-center text-muted-foreground italic flex flex-col items-center justify-center gap-4">
            <span>No articles found.</span>
            {posts.length === 0 && (
              <Button variant="outline" size="sm" className="font-bold" asChild>
                <Link href="/admin/blog/create">
                  Write Your First Article
                </Link>
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
