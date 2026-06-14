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
  content: string; // Markdown/HTML content string for render
  coverImage: string;
  date: string; // e.g. "2026-06-14"
  readTime: string; // e.g. "5 min read"
  category: string; // e.g. "Lead Gen", "SEO", "Sales Selling"
  tags: string[];
  author: Author;
}
