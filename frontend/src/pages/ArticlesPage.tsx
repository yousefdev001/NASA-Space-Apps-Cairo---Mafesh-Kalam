import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { clsx } from 'clsx';
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
import { useThemeStore } from '../store/themeStore';
import { ArticleReaderModal } from '../components/articles/ArticleReaderModal';
import { PublishArticleModal } from '../components/articles/PublishArticleModal';
import {
  getWobblyStyle,
  Tape,
  PushPin,
  SquiggleUnderline,
  SketchBadge,
} from '../components/sketchbook';

export const ArticlesPage: React.FC = () => {
  const { mode } = useThemeStore();
  const isPaper = mode === 'paper';
  const isDark = mode === 'dark';
  const isSketch = isPaper || isDark;

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
      <div
        style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
        className={clsx(
          'relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 transition-all',
          isPaper
            ? 'bg-white text-[#2d2d2d] border-[3px] border-[#2d2d2d] sketch-shadow-lg'
            : isDark
              ? 'bg-[#0c0c10] text-white border-[3px] border-[#FF4D00] sketch-shadow-orange-lg'
              : 'border-b border-[#1E3A5F] pb-2'
        )}
      >
        {isSketch && (
          <div className="absolute -top-3.5 left-10 z-10">
            <Tape isDark={isDark} />
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {isSketch ? (
              <span
                style={getWobblyStyle('wobblyTag')}
                className={clsx(
                  'text-[10px] font-sketch-hand px-2.5 py-0.5 border-2 uppercase font-bold tracking-wider',
                  isPaper
                    ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d]'
                    : 'bg-[#FF4D00] text-black border-white'
                )}
              >
                PUBLIC ACCESS CLINICAL REPOSITORY
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-widest font-bold">
                PUBLIC ACCESS TELEMETRY PORTAL
              </span>
            )}
            {isSketch ? (
              <span
                style={getWobblyStyle('wobblyTag')}
                className={clsx(
                  'text-[10px] font-sketch-hand px-2 py-0.5 border-2 uppercase font-bold tracking-wider',
                  isPaper
                    ? 'bg-emerald-100 text-emerald-900 border-[#2d2d2d]'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-400'
                )}
              >
                PEER-REVIEWED ARCHIVE
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                LIVE &amp; OPERATIONAL
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <BookOpen
              className={clsx(
                'w-7 h-7 shrink-0',
                isPaper ? 'text-[#2d5da1]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
              )}
            />
            <div>
              <h1
                className={clsx(
                  'text-2xl sm:text-3xl font-bold tracking-wide',
                  isSketch ? 'font-display-kalam' : 'font-mono text-white'
                )}
              >
                AURAMED EDUCATIONAL KNOWLEDGE PORTAL
              </h1>
              {isSketch && (
                <div className="w-56 text-[#ff4d00]">
                  <SquiggleUnderline />
                </div>
              )}
            </div>
          </div>
          <p
            className={clsx(
              'text-xs mt-1',
              isSketch ? 'font-sketch-hand text-sm font-semibold opacity-80' : 'font-mono text-slate-400'
            )}
          >
            PEER-REVIEWED BIO-ASTRONAUTICS RESEARCH &amp; INTERACTIVE JUNIOR CADET GUIDES
          </p>
        </div>

        {/* Publish Action Button */}
        {canPublishArticle && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsPublishOpen(true)}
            style={isSketch ? getWobblyStyle('wobblySm') : undefined}
            className={clsx(
              'self-start md:self-auto shrink-0 font-bold',
              isSketch
                ? isDark
                  ? 'bg-[#FF4D00] text-black border-2 border-white sketch-btn-orange font-sketch-hand text-base px-5'
                  : 'bg-[#ff4d00] text-white border-2 border-[#2d2d2d] sketch-btn font-sketch-hand text-base px-5'
                : 'shadow-[0_0_20px_rgba(0,229,255,0.35)]'
            )}
          >
            <Plus className="w-4 h-4 mr-1.5" /> + Publish Article
          </Button>
        )}
      </div>

      {/* Portal Telemetry Stats Ribbon - Sticky Note Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
          className={clsx(
            'p-3.5 border flex items-center gap-3 transition-all',
            isPaper
              ? 'bg-white border-2 border-[#2d2d2d] sketch-shadow text-[#2d2d2d]'
              : isDark
                ? 'bg-[#0c0c10] border-2 border-[#FF4D00] sketch-shadow-orange text-white'
                : 'bg-[#0B132B] rounded-xl border-[#1E3A5F]'
          )}
        >
          <div
            style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
            className={clsx(
              'w-10 h-10 border flex items-center justify-center shrink-0',
              isPaper
                ? 'bg-[#2d5da1]/15 border-2 border-[#2d2d2d] text-[#2d5da1]'
                : isDark
                  ? 'bg-[#FF4D00]/20 border-2 border-[#FF4D00] text-[#FF4D00]'
                  : 'rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400'
            )}
          >
            <BookCheck className="w-5 h-5" />
          </div>
          <div>
            <div
              className={clsx(
                'text-xs',
                isSketch ? 'font-sketch-hand font-bold opacity-75' : 'font-mono text-slate-400'
              )}
            >
              Total Articles
            </div>
            <div
              className={clsx(
                'text-lg font-bold',
                isSketch ? 'font-display-kalam text-xl' : 'font-mono text-white'
              )}
            >
              {stats.total}
            </div>
          </div>
        </div>

        <div
          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
          className={clsx(
            'p-3.5 border flex items-center gap-3 transition-all',
            isPaper
              ? 'bg-white border-2 border-[#2d2d2d] sketch-shadow text-[#2d2d2d]'
              : isDark
                ? 'bg-[#0c0c10] border-2 border-[#FF4D00] sketch-shadow-orange text-white'
                : 'bg-[#0B132B] rounded-xl border border-amber-500/30'
          )}
        >
          <div
            style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
            className={clsx(
              'w-10 h-10 border flex items-center justify-center shrink-0',
              isPaper
                ? 'bg-[#fff9c4] border-2 border-[#2d2d2d] text-[#2d2d2d]'
                : isDark
                  ? 'bg-amber-950/60 border-2 border-amber-500/60 text-amber-400'
                  : 'rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-400'
            )}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div
              className={clsx(
                'text-xs',
                isSketch ? 'font-sketch-hand font-bold text-amber-600 dark:text-amber-300' : 'font-mono text-amber-300'
              )}
            >
              Junior Guides (Kids)
            </div>
            <div
              className={clsx(
                'text-lg font-bold text-amber-500',
                isSketch ? 'font-display-kalam text-xl' : 'font-mono'
              )}
            >
              {stats.kidsCount}
            </div>
          </div>
        </div>

        <div
          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
          className={clsx(
            'p-3.5 border flex items-center gap-3 transition-all',
            isPaper
              ? 'bg-white border-2 border-[#2d2d2d] sketch-shadow text-[#2d2d2d]'
              : isDark
                ? 'bg-[#0c0c10] border-2 border-[#FF4D00] sketch-shadow-orange text-white'
                : 'bg-[#0B132B] rounded-xl border border-cyan-500/30'
          )}
        >
          <div
            style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
            className={clsx(
              'w-10 h-10 border flex items-center justify-center shrink-0',
              isPaper
                ? 'bg-cyan-100 border-2 border-[#2d2d2d] text-[#2d5da1]'
                : isDark
                  ? 'bg-cyan-950/60 border-2 border-cyan-500/60 text-cyan-400'
                  : 'rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400'
            )}
          >
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div
              className={clsx(
                'text-xs',
                isSketch ? 'font-sketch-hand font-bold text-cyan-700 dark:text-cyan-300' : 'font-mono text-cyan-300'
              )}
            >
              Clinical Monographs
            </div>
            <div
              className={clsx(
                'text-lg font-bold text-cyan-500',
                isSketch ? 'font-display-kalam text-xl' : 'font-mono'
              )}
            >
              {stats.adultsCount}
            </div>
          </div>
        </div>

        <div
          style={isSketch ? getWobblyStyle('wobblySm') : undefined}
          className={clsx(
            'p-3.5 border flex items-center gap-3 transition-all',
            isPaper
              ? 'bg-white border-2 border-[#2d2d2d] sketch-shadow text-[#2d2d2d]'
              : isDark
                ? 'bg-[#0c0c10] border-2 border-[#FF4D00] sketch-shadow-orange text-white'
                : 'bg-[#0B132B] rounded-xl border border-[#1E3A5F]'
          )}
        >
          <div
            style={isSketch ? getWobblyStyle('wobblyCircle') : undefined}
            className={clsx(
              'w-10 h-10 border flex items-center justify-center shrink-0',
              isPaper
                ? 'bg-emerald-100 border-2 border-[#2d2d2d] text-emerald-800'
                : isDark
                  ? 'bg-emerald-950/60 border-2 border-emerald-500/60 text-emerald-400'
                  : 'rounded-lg bg-slate-900 border border-slate-700 text-emerald-400'
            )}
          >
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div
              className={clsx(
                'text-xs',
                isSketch ? 'font-sketch-hand font-bold opacity-75' : 'font-mono text-slate-400'
              )}
            >
              Portal Views
            </div>
            <div
              className={clsx(
                'text-lg font-bold text-emerald-500',
                isSketch ? 'font-display-kalam text-xl' : 'font-mono'
              )}
            >
              {stats.totalViews.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls - Card Catalog Index Card */}
      <div
        style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
        className={clsx(
          'relative p-4 space-y-4 border transition-all',
          isPaper
            ? 'bg-white border-[3px] border-[#2d2d2d] sketch-shadow'
            : isDark
              ? 'bg-[#0c0c10] border-[3px] border-[#FF4D00] sketch-shadow-orange'
              : 'p-4 rounded-2xl bg-[#0B132B] border-[#1E3A5F]'
        )}
      >
        {isSketch && (
          <div className="absolute -top-2.5 right-8 z-10">
            <PushPin isDark={isDark} />
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Audience Filter Pills */}
          <div
            style={isSketch ? getWobblyStyle('wobblySm') : undefined}
            className={clsx(
              'flex flex-wrap items-center gap-1.5 p-1.5 border',
              isPaper
                ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d]'
                : isDark
                  ? 'bg-black border-2 border-[#FF4D00]'
                  : 'bg-[#050B14] rounded-xl border-[#1E3A5F]'
            )}
          >
            <button
              onClick={() => {
                setAudience('all');
                setCategory('all');
              }}
              style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
              className={clsx(
                'px-3 py-1.5 text-xs font-bold transition-all cursor-pointer',
                isSketch
                  ? audience === 'all'
                    ? isDark
                      ? 'bg-[#FF4D00] text-black border-2 border-white sketch-btn-orange font-sketch-hand'
                      : 'bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand'
                    : isDark
                      ? 'text-white/70 hover:text-white font-sketch-hand'
                      : 'text-[#2d2d2d]/70 hover:text-black font-sketch-hand'
                  : audience === 'all'
                    ? 'rounded-lg bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(0,229,255,0.4)] font-mono'
                    : 'text-slate-400 hover:text-white font-mono'
              )}
            >
              All Articles ({articles.length})
            </button>

            <button
              onClick={() => {
                setAudience('kids');
                setCategory('all');
              }}
              style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
              className={clsx(
                'px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer',
                isSketch
                  ? audience === 'kids'
                    ? isDark
                      ? 'bg-[#FF4D00] text-black border-2 border-white sketch-btn-orange font-sketch-hand'
                      : 'bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand'
                    : isDark
                      ? 'text-white/70 hover:text-white font-sketch-hand'
                      : 'text-[#2d2d2d]/70 hover:text-black font-sketch-hand'
                  : audience === 'kids'
                    ? 'rounded-lg bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] font-mono'
                    : 'text-slate-400 hover:text-white font-mono'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Junior Cadets (Kids)
            </button>

            <button
              onClick={() => {
                setAudience('adults');
                setCategory('all');
              }}
              style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
              className={clsx(
                'px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer',
                isSketch
                  ? audience === 'adults'
                    ? isDark
                      ? 'bg-[#FF4D00] text-black border-2 border-white sketch-btn-orange font-sketch-hand'
                      : 'bg-[#2d5da1]/20 text-[#2d5da1] border-2 border-[#2d5da1] sketch-btn font-sketch-hand'
                    : isDark
                      ? 'text-white/70 hover:text-white font-sketch-hand'
                      : 'text-[#2d2d2d]/70 hover:text-black font-sketch-hand'
                  : audience === 'adults'
                    ? 'rounded-lg bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,229,255,0.4)] font-mono'
                    : 'text-slate-400 hover:text-white font-mono'
              )}
            >
              <Activity className="w-3.5 h-3.5" />
              Clinical Flight Surgeons
            </button>
          </div>

          {/* Search Bar & Category Dropdown */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 lg:max-w-md">
            <div className="relative w-full">
              <Search
                className={clsx(
                  'w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2',
                  isSketch ? 'text-[#2d2d2d]/60 dark:text-white/60' : 'text-slate-500'
                )}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles, topics, or tags..."
                style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                className={clsx(
                  'w-full pl-9 pr-8 py-2 text-xs focus:outline-none transition-colors border',
                  isPaper
                    ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] placeholder-[#2d2d2d]/50 font-sketch-hand text-sm'
                    : isDark
                      ? 'bg-black border-2 border-[#FF4D00] text-white placeholder-white/50 font-sketch-hand text-sm focus:border-white'
                      : 'rounded-xl bg-[#050B14] border-[#1E3A5F] text-white placeholder-slate-500 focus:border-cyan-400 font-mono'
                )}
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
                  style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                  className={clsx(
                    'w-full px-3 py-2 text-xs focus:outline-none border cursor-pointer',
                    isPaper
                      ? 'bg-[#fdfbf7] border-2 border-[#2d2d2d] text-[#2d2d2d] font-sketch-hand text-sm'
                      : isDark
                        ? 'bg-black border-2 border-[#FF4D00] text-white font-sketch-hand text-sm'
                        : 'rounded-xl bg-[#050B14] border-[#1E3A5F] text-slate-300 focus:border-cyan-400 font-mono'
                  )}
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
          <div
            className={clsx(
              'pt-2 flex items-center justify-between text-xs border-t',
              isSketch
                ? isDark
                  ? 'border-[#FF4D00]/40 border-dashed font-sketch-hand text-sm'
                  : 'border-[#2d2d2d]/30 border-dashed font-sketch-hand text-sm'
                : 'border-[#1E3A5F]/60 font-mono text-slate-400'
            )}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-[11px] font-bold opacity-75">
                <Filter className="w-3 h-3 text-[#ff4d00]" /> ACTIVE FILTERS:
              </span>
              {audience !== 'all' && (
                <span
                  style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                  className={clsx(
                    'px-2 py-0.5 text-[11px] border',
                    isPaper
                      ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d]'
                      : isDark
                        ? 'bg-[#FF4D00]/25 text-[#FF4D00] border-[#FF4D00]'
                        : 'rounded bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
                  )}
                >
                  Audience: {audience === 'kids' ? 'Junior Cadets' : 'Clinical Surgeons'}
                </span>
              )}
              {category !== 'all' && (
                <span
                  style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                  className={clsx(
                    'px-2 py-0.5 text-[11px] border',
                    isPaper
                      ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d]'
                      : isDark
                        ? 'bg-[#FF4D00]/25 text-[#FF4D00] border-[#FF4D00]'
                        : 'rounded bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
                  )}
                >
                  Category: {category}
                </span>
              )}
              {search && (
                <span
                  style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                  className={clsx(
                    'px-2 py-0.5 text-[11px] border',
                    isPaper
                      ? 'bg-[#fff9c4] text-[#2d2d2d] border-[#2d2d2d]'
                      : isDark
                        ? 'bg-[#FF4D00]/25 text-[#FF4D00] border-[#FF4D00]'
                        : 'rounded bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
                  )}
                >
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
              className={clsx(
                'text-[11px] flex items-center gap-1 hover:underline cursor-pointer font-bold',
                isPaper ? 'text-[#ff4d00]' : isDark ? 'text-[#FF4D00]' : 'text-cyan-400'
              )}
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
              style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
              className={clsx(
                'h-64 p-6 animate-pulse flex flex-col justify-between border',
                isPaper
                  ? 'bg-white border-2 border-[#2d2d2d] sketch-shadow'
                  : isDark
                    ? 'bg-[#0c0c10] border-2 border-[#FF4D00] sketch-shadow-orange'
                    : 'rounded-2xl bg-[#0B132B]/60 border-[#1E3A5F]'
              )}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-24 bg-slate-700/50 rounded" />
                  <div className="h-4 w-16 bg-slate-700/50 rounded" />
                </div>
                <div className="h-6 w-3/4 bg-slate-700/50 rounded" />
                <div className="h-16 w-full bg-slate-700/30 rounded" />
              </div>
              <div className="h-8 w-full bg-slate-700/50 rounded mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Error Banner */}
      {!isLoading && error && (
        <div
          style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
          className={clsx(
            'p-8 text-center space-y-3 border',
            isPaper
              ? 'bg-rose-50 border-2 border-[#2d2d2d] text-rose-900 sketch-shadow'
              : isDark
                ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 sketch-shadow-orange'
                : 'rounded-2xl bg-rose-950/20 border-rose-500/40'
          )}
        >
          <p className="text-sm font-bold">{error}</p>
          <Button variant="danger" size="sm" onClick={loadArticles}>
            Retry Telemetry Link
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && articles.length === 0 && (
        <div
          style={isSketch ? getWobblyStyle('wobblyMd') : undefined}
          className={clsx(
            'py-16 text-center space-y-4 border border-dashed',
            isPaper
              ? 'bg-white border-2 border-[#2d2d2d] text-[#2d2d2d] sketch-shadow'
              : isDark
                ? 'bg-[#0c0c10] border-2 border-[#FF4D00] text-white sketch-shadow-orange'
                : 'rounded-2xl bg-[#0B132B]/50 border-[#1E3A5F]'
          )}
        >
          <BookOpen className="w-12 h-12 text-slate-500 mx-auto" />
          <div>
            <h3
              className={clsx(
                'text-base font-bold',
                isSketch ? 'font-display-kalam text-lg' : 'font-mono text-white'
              )}
            >
              NO ARTICLES DISCOVERED
            </h3>
            <p
              className={clsx(
                'text-xs mt-1 max-w-md mx-auto',
                isSketch ? 'font-sketch-hand text-sm opacity-80' : 'text-slate-400'
              )}
            >
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

      {/* Articles Grid - Research Library Cards as Published NASA Spaceflight Papers */}
      {!isLoading && !error && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((article, idx) => {
            const isKids = article.target_audience === 'kids';

            return (
              <Card
                key={article.id}
                themeMode={mode}
                decoration={isSketch ? (idx % 2 === 0 ? 'tape' : 'pin') : 'none'}
                className={clsx(
                  'flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1',
                  isSketch
                    ? clsx(
                        isPaper ? 'paper-grain' : 'paper-grain-dark',
                        isDark ? 'hover:shadow-[0_0_25px_rgba(255,77,0,0.3)]' : 'hover:shadow-[6px_6px_0px_0px_#2d2d2d]'
                      )
                    : isKids
                      ? 'border-amber-500/30 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.25)] bg-[#0B132B]/90'
                      : 'border-[#1E3A5F] hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(0,229,255,0.25)] bg-[#0B132B]/95'
                )}
              >
                <div>
                  {/* Card Header Pills */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isSketch ? (
                        <SketchBadge
                          variant={isKids ? 'warning' : 'info'}
                          mode={mode}
                        >
                          {isKids ? '🚀 Junior' : '🩺 Clinical Paper'}
                        </SketchBadge>
                      ) : (
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-full text-[10px] uppercase border ${
                            isKids
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          }`}
                        >
                          {isKids ? '🚀 Junior' : '🩺 Clinical'}
                        </span>
                      )}

                      {isSketch ? (
                        <SketchBadge variant="neutral" mode={mode}>
                          {article.category}
                        </SketchBadge>
                      ) : (
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            isKids ? 'text-amber-400' : 'text-cyan-400'
                          }`}
                        >
                          {article.category}
                        </span>
                      )}
                    </div>

                    <span
                      style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                      className={clsx(
                        'text-[11px] flex items-center gap-1',
                        isSketch
                          ? 'font-sketch-hand px-2 py-0.5 border border-dashed font-bold opacity-80'
                          : 'font-mono text-slate-400'
                      )}
                    >
                      <Clock className="w-3 h-3 text-amber-400/80" /> {article.reading_time_minutes}m
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => handleOpenReader(article.slug)}
                    className={clsx(
                      'text-base font-bold mb-2 leading-snug cursor-pointer transition-colors',
                      isSketch
                        ? 'font-display-kalam text-lg sm:text-xl hover:text-[#ff4d00]'
                        : 'font-sans text-white group-hover:text-cyan-300'
                    )}
                  >
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  <p
                    className={clsx(
                      'text-xs leading-relaxed line-clamp-3 mb-4',
                      isSketch
                        ? isDark
                          ? 'text-white/80 font-sketch-hand text-sm'
                          : 'text-[#2d2d2d]/85 font-sketch-hand text-sm'
                        : 'text-slate-300 font-sans'
                    )}
                  >
                    {article.excerpt}
                  </p>

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {article.tags.slice(0, 3).map((t) => (
                        <span
                          key={t.id}
                          style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                          className={clsx(
                            'px-2 py-0.5 text-[10px] border',
                            isPaper
                              ? 'bg-[#e5e0d8] text-[#2d2d2d] border-[#2d2d2d] font-sketch-hand'
                              : isDark
                                ? 'bg-black text-white/80 border-[#FF4D00]/50 font-sketch-hand'
                                : 'rounded font-mono bg-[#050B14] text-slate-400 border-[#1E3A5F]'
                          )}
                        >
                          #{t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer - Published Author & Clinical Seal Tag */}
                <div
                  className={clsx(
                    'mt-4 pt-3 flex items-center justify-between text-xs border-t',
                    isSketch
                      ? isDark
                        ? 'border-[#FF4D00]/40 border-dashed'
                        : 'border-[#2d2d2d]/30 border-dashed'
                      : 'border-[#1E3A5F] font-mono'
                  )}
                >
                  <div
                    style={isSketch ? getWobblyStyle('wobblyTag') : undefined}
                    className={clsx(
                      'flex items-center gap-2.5 text-[11px]',
                      isSketch
                        ? 'p-1 px-2 border font-sketch-hand font-bold ' +
                          (isDark ? 'bg-black border-[#FF4D00]/40 text-white/90' : 'bg-[#fff9c4] border-[#2d2d2d] text-[#2d2d2d]')
                        : 'text-slate-400'
                    )}
                  >
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#ff4d00]" />
                      {article.author?.name ? article.author.name.split(' ')[0] : 'Dr. Henrik'}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {formatDate(article.published_at)}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {article.views_count}
                    </span>
                  </div>

                  <Button
                    variant={isSketch ? 'secondary' : isKids ? 'secondary' : 'hud'}
                    size="sm"
                    onClick={() => handleOpenReader(article.slug)}
                    style={isSketch ? getWobblyStyle('wobblySm') : undefined}
                    className={clsx(
                      'text-[11px] transition-all font-bold',
                      isSketch
                        ? isDark
                          ? 'bg-[#FF4D00] text-black border-2 border-white sketch-btn-orange font-sketch-hand'
                          : 'bg-[#fff9c4] text-[#2d2d2d] border-2 border-[#2d2d2d] sketch-btn font-sketch-hand'
                        : isKids
                          ? 'text-amber-400 border-amber-500/40 hover:bg-amber-500/10'
                          : ''
                    )}
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
