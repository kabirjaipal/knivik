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

  const totalPosts = posts.length;
  const publishedCount = posts.filter((p) => p.status === "PUBLISHED").length;
  const draftCount = posts.filter((p) => p.status === "DRAFT").length;
  const uniqueCategories = Array.from(new Set(posts.map((p) => p.category))).length;
  const uniqueTags = Array.from(new Set(posts.flatMap((p) => p.tags))).length;

  const statsList = [
    { label: "Total Posts", value: totalPosts, icon: FileText, color: "text-primary bg-primary/10 border-primary/20" },
    { label: "Published", value: publishedCount, icon: FolderOpen, color: "text-success bg-success/10 border-success/20" },
    { label: "Drafts", value: draftCount, icon: Tag, color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <h2 className="text-xl font-black tracking-tight text-foreground">Blog</h2>
        <Button variant="default" size="sm" className="font-bold gap-2" asChild>
          <Link href="/admin/blog/create">
            <Plus className="w-4 h-4" /> Create Post
          </Link>
        </Button>
      </div>

      {/* Stats Cards - generated dynamically to avoid JSX repetition */}
      <div className="grid gap-6 sm:grid-cols-3">
        {statsList.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className={`border ${stat.color}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center w-full max-w-md relative">
        <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search by title, category, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {/* Table listing */}
      <Card className="border-border/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/10 hover:bg-muted/10">
              <TableHead className="font-bold">Article</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Category</TableHead>
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="font-bold">Author</TableHead>
              <TableHead className="font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPosts.map((post) => (
              <TableRow key={post.id} className="hover:bg-muted/5">
                <TableCell>
                  <div className="flex flex-col max-w-xs sm:max-w-md">
                    <span className="font-bold text-sm text-foreground line-clamp-1">
                      {post.title}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      /{post.slug}
                    </span>
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] py-0 px-1.5 uppercase font-bold tracking-wider">
                            {tag}
                          </Badge>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground font-bold">
                            +{post.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`text-[10px] font-black uppercase tracking-wider border-0 ${
                      post.status === "PUBLISHED"
                        ? "bg-success/15 text-success"
                        : "bg-yellow-500/15 text-yellow-400"
                    }`}
                  >
                    {post.status === "PUBLISHED" ? "● Live" : "● Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-black uppercase tracking-widest text-[10px]">
                    {post.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground font-mono whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    {new Date(post.date).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium text-foreground">
                  {post.createdBy?.displayUsername || post.createdBy?.username || "Admin"}
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
              <Button variant="outline-primary" size="sm" className="font-bold" asChild>
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
