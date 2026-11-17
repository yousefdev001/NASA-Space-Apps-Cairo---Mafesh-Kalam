import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  BookOpen,
  Clock,
  ArrowRight,
  Search,
  Sparkles,
  Activity,
  Plus,
  Eye,
  Calendar,
  Filter,
  RotateCcw,
  BookCheck,
  Users,
} from 'lucide-react';
import { Article } from '../types/article.types';
import { articlesApi } from '../api/articlesApi';
import { useAuthStore } from '../store/authStore';
import { ArticleReaderModal } from '../components/articles/ArticleReaderModal';
import { PublishArticleModal } from '../components/articles/PublishArticleModal';

export const ArticlesPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [audience, setAudience] = useState<'all' | 'kids' | 'adults'>('all');
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Modals state
  const [readerSlug, setReaderSlug] = useState<string | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  // Authentication check for "+ Publish Article"
  const { hasPermission, hasRole } = useAuthStore();
  const canPublishArticle =
    hasPermission('create_articles') ||
    hasRole(['educator_content_creator', 'system_administrator', 'flight_surgeon']);

  const loadArticles = useCallback(() => {
    let isCurrent = true;
    queueMicrotask(() => {
      if (isCurrent) {
        setIsLoading(true);
        setError(null);
      }
    });

    articlesApi
      .getArticles({
        audience: audience === 'all' ? undefined : audience,
        category: category === 'all' ? undefined : category,
        search: search.trim() || undefined,
      })
      .then((data) => {
        if (isCurrent) {
          setArticles(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          console.error('Failed to fetch articles:', err);
          setError('Failed to establish telemetry link with AuraMed Knowledge Repository.');
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [audience, category, search]);

  useEffect(() => {
    const cleanup = loadArticles();
    return cleanup;
  }, [loadArticles]);

  // Unique categories list
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    articles.forEach((a) => {
      if (a.category) cats.add(a.category);
    });
    return Array.from(cats);
  }, [articles]);

  // Telemetry stats
  const stats = useMemo(() => {
    const total = articles.length;
    const kidsCount = articles.filter((a) => a.target_audience === 'kids').length;
    const adultsCount = articles.filter((a) => a.target_audience === 'adults').length;
    const totalViews = articles.reduce((sum, a) => sum + (a.views_count || 0), 0);
    return { total, kidsCount, adultsCount, totalViews };
  }, [articles]);

  const handleOpenReader = (slug: string) => {
    setReaderSlug(slug);
    setIsReaderOpen(true);
  };

  const handleCloseReader = () => {
    setIsReaderOpen(false);
    setReaderSlug(null);
    // Refresh to sync updated views counts
    loadArticles();
  };

  const handleArticleCreated = (newArticle: Article) => {
    loadArticles();
    // Open the newly created article in reader modal
    if (newArticle.slug) {
      handleOpenReader(newArticle.slug);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in">
      {/* Top Header & Action Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1E3A5F]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-widest font-bold">
              PUBLIC ACCESS TELEMETRY PORTAL
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              LIVE & OPERATIONAL
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wide flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-cyan-400 shrink-0" />
            AURAMED EDUCATIONAL KNOWLEDGE PORTAL
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            PEER-REVIEWED BIO-ASTRONAUTICS RESEARCH & INTERACTIVE JUNIOR CADET GUIDES
          </p>
        </div>

        {/* Publish Action Button */}
        {canPublishArticle && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsPublishOpen(true)}
            className="self-start md:self-auto shadow-[0_0_20px_rgba(0,229,255,0.35)] shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> + Publish Article
          </Button>
        )}
      </div>

      {/* Portal Telemetry Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 rounded-xl bg-[#0B132B] border border-[#1E3A5F] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <BookCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400">Total Articles</div>
            <div className="text-lg font-mono font-bold text-white">{stats.total}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0B132B] border border-amber-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono text-amber-300">Junior Guides (Kids)</div>
            <div className="text-lg font-mono font-bold text-amber-400">{stats.kidsCount}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0B132B] border border-cyan-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono text-cyan-300">Clinical Monographs</div>
            <div className="text-lg font-mono font-bold text-cyan-400">{stats.adultsCount}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0B132B] border border-[#1E3A5F] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono text-slate-400">Portal Views</div>
            <div className="text-lg font-mono font-bold text-emerald-400">
              {stats.totalViews.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-[#0B132B] border border-[#1E3A5F] space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Audience Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#050B14] p-1.5 rounded-xl border border-[#1E3A5F]">
            <button
              onClick={() => {
                setAudience('all');
                setCategory('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                audience === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Articles ({articles.length})
            </button>

            <button
              onClick={() => {
                setAudience('kids');
                setCategory('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                audience === 'kids'
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Junior Cadets (Kids)
            </button>

            <button
              onClick={() => {
                setAudience('adults');
                setCategory('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                audience === 'adults'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Clinical Flight Surgeons
            </button>
          </div>

          {/* Search Bar & Category Dropdown */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 lg:max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles, topics, or tags..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#050B14] border border-[#1E3A5F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono"
                >
                  ×
                </button>
              )}
            </div>

            {availableCategories.length > 0 && (
              <div className="relative w-full sm:w-48 shrink-0">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E3A5F] text-xs text-slate-300 focus:outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="all">All Categories</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(audience !== 'all' || category !== 'all' || search.trim() !== '') && (
          <div className="pt-2 border-t border-[#1E3A5F]/60 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                <Filter className="w-3 h-3 text-cyan-400" /> ACTIVE FILTERS:
              </span>
              {audience !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[11px]">
                  Audience: {audience === 'kids' ? 'Junior Cadets' : 'Clinical Surgeons'}
                </span>
              )}
              {category !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[11px]">
                  Category: {category}
                </span>
              )}
              {search && (
                <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[11px]">
                  Query: &quot;{search}&quot;
                </span>
              )}
            </div>

            <button
              onClick={() => {
                setAudience('all');
                setCategory('all');
                setSearch('');
              }}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-[#0B132B]/60 border border-[#1E3A5F] p-6 animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-slate-800 rounded" />
                  <div className="h-4 w-16 bg-slate-800 rounded" />
                </div>
                <div className="h-6 w-3/4 bg-slate-800 rounded" />
                <div className="h-16 w-full bg-slate-800/60 rounded" />
              </div>
              <div className="h-8 w-full bg-slate-800 rounded mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Error Banner */}
      {!isLoading && error && (
        <div className="p-8 rounded-2xl bg-rose-950/20 border border-rose-500/40 text-center space-y-3">
          <p className="text-sm font-mono text-rose-300">{error}</p>
          <Button variant="danger" size="sm" onClick={loadArticles}>
            Retry Telemetry Link
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && articles.length === 0 && (
        <div className="py-16 text-center space-y-4 rounded-2xl bg-[#0B132B]/50 border border-dashed border-[#1E3A5F]">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-base font-mono font-bold text-white">NO ARTICLES DISCOVERED</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              No space medicine articles match your filter or search query. Try clearing the search or
              selecting another audience category.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setAudience('all');
              setCategory('all');
              setSearch('');
            }}
          >
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Articles Grid */}
      {!isLoading && !error && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article) => {
            const isKids = article.target_audience === 'kids';

            return (
              <Card
                key={article.id}
                className={`flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 ${
                  isKids
                    ? 'border-amber-500/30 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] bg-[#0B132B]/90'
                    : 'border-[#1E3A5F] hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(0,229,255,0.25)] bg-[#0B132B]/95'
                }`}
              >
                <div>
                  {/* Card Header Pills */}
                  <div className="flex items-center justify-between text-xs font-mono mb-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase border ${
                          isKids
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        }`}
                      >
                        {isKids ? '🚀 Junior' : '🩺 Clinical'}
                      </span>
                      <span
                        className={`text-[11px] font-bold ${
                          isKids ? 'text-amber-400' : 'text-cyan-400'
                        }`}
                      >
                        {article.category}
                      </span>
                    </div>

                    <span className="text-slate-400 text-[11px] flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-amber-400/80" /> {article.reading_time_minutes}m
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => handleOpenReader(article.slug)}
                    className="text-base font-bold text-white mb-2 leading-snug cursor-pointer group-hover:text-cyan-300 transition-colors"
                  >
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3 mb-4">
                    {article.excerpt}
                  </p>

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {article.tags.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#050B14] text-slate-400 border border-[#1E3A5F]"
                        >
                          #{t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-[#1E3A5F] flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-500" />
                      {article.author?.name ? article.author.name.split(' ')[0] : 'Dr. Henrik'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {formatDate(article.published_at)}
                    </span>
                    <span className="flex items-center gap-1 text-cyan-400/80">
                      <Eye className="w-3 h-3" />
                      {article.views_count}
                    </span>
                  </div>

                  <Button
                    variant={isKids ? 'secondary' : 'hud'}
                    size="sm"
                    onClick={() => handleOpenReader(article.slug)}
                    className={`text-[11px] transition-all group-hover:scale-105 ${
                      isKids ? 'text-amber-400 border-amber-500/40 hover:bg-amber-500/10' : ''
                    }`}
                  >
                    Read <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reader Modal Drawer */}
      <ArticleReaderModal
        slug={readerSlug}
        isOpen={isReaderOpen}
        onClose={handleCloseReader}
        onSelectArticle={(slug) => setReaderSlug(slug)}
      />

      {/* Publish Article Modal */}
      <PublishArticleModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        onArticleCreated={handleArticleCreated}
      />
    </div>
  );
};
