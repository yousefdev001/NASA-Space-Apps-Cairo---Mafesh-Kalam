import apiClient from './client';
import {
  Article,
  ArticleDetailData,
  CreateArticlePayload,
  ArticlesQueryParams,
} from '../types/article.types';

export const articlesApi = {
  /**
   * Fetch public educational articles with audience, category, and search query filters.
   */
  async getArticles(params?: ArticlesQueryParams): Promise<Article[]> {
    const query: Record<string, string | number> = {};
    if (params?.audience && params.audience !== 'all') {
      query.audience = params.audience;
    }
    if (params?.category && params.category !== 'all') {
      query.category = params.category;
    }
    if (params?.search && params.search.trim().length > 0) {
      query.search = params.search.trim();
    }
    if (params?.page) {
      query.page = params.page;
    }
    if (params?.per_page) {
      query.per_page = params.per_page;
    }

    const res = await apiClient.get('/public/articles', { params: query });
    return res.data.data;
  },

  /**
   * Fetch a single article by its unique slug, including related articles.
   * Also increments the article's views count on the backend.
   */
  async getArticleDetail(slug: string): Promise<ArticleDetailData> {
    const res = await apiClient.get(`/public/articles/${slug}`);
    return res.data.data;
  },

  /**
   * Publish a new educational article (requires educator_content_creator or system_administrator role).
   */
  async createArticle(payload: CreateArticlePayload): Promise<Article> {
    const res = await apiClient.post('/articles', payload);
    return res.data.data;
  },
};

export default articlesApi;
