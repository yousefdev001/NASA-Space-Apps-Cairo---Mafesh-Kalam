export interface ArticleTag {
  id: number;
  name: string;
  slug: string;
}

export interface ArticleAuthor {
  id: number;
  name: string;
}

export interface Article {
  id: number;
  uuid: string;
  author_id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  target_audience: 'kids' | 'adults';
  category: string;
  thumbnail_path?: string | null;
  reading_time_minutes: number;
  is_published: boolean;
  published_at: string;
  views_count: number;
  created_at: string;
  updated_at: string;
  tags?: ArticleTag[];
  author?: ArticleAuthor;
}

export interface ArticleDetailData {
  article: Article;
  related: Article[];
}

export interface CreateArticlePayload {
  title: string;
  target_audience: 'kids' | 'adults';
  category: string;
  reading_time_minutes: number;
  excerpt: string;
  content: string;
  tags?: string[];
  is_published?: boolean;
}

export interface ArticlesQueryParams {
  audience?: 'kids' | 'adults' | 'all';
  category?: string;
  search?: string;
  page?: number;
  per_page?: number;
}
