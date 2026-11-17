import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  Clock,
  Eye,
  Calendar,
  User,
  Tag,
  ArrowRight,
  BookOpen,
  Sparkles,
  Share2,
  Check,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { ArticleDetailData, Article } from '../../types/article.types';
import { articlesApi } from '../../api/articlesApi';
import { MarkdownArticleContent } from './MarkdownArticleContent';
import { Button } from '../ui/Button';

interface ArticleReaderModalProps {
  slug: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (slug: string) => void;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  slug,
  isOpen,
  onClose,
  onSelectArticle,
}) => {
  const [data, setData] = useState<ArticleDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !slug) return;

    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        setIsLoading(true);
        setError(null);
      }
    });

    articlesApi
      .getArticleDetail(slug)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setIsLoading(false);
          // Reset scroll position to top
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load article details:', err);
          setError('Failed to load article from AuraMed Knowledge Base. Please try again.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, slug]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const article: Article | undefined = data?.article;
  const relatedArticles: Article[] = data?.related || [];
  const isKids = article?.target_audience === 'kids';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + `/articles#${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently Published';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#050B14]/85 backdrop-blur-md animate-in fade-in">
      <div
        className={`relative w-full max-w-4xl bg-[#0B132B] border rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.2)] flex flex-col max-h-[92vh] overflow-hidden ${
          isKids
            ? 'border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.2)]'
            : 'border-cyan-500/40 shadow-[0_0_50px_rgba(0,229,255,0.2)]'
        }`}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E3A5F] bg-[#050B14]/90 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isKids
                  ? 'bg-amber-950 border border-amber-500/50 text-amber-400'
                  : 'bg-cyan-950 border border-cyan-500/50 text-cyan-400'
              }`}
            >
              {isKids ? <Sparkles className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                    isKids
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  }`}
                >
                  {isKids ? '🚀 Junior Cadet Space Guide' : '🩺 Clinical Bio-Astronautics Monograph'}
                </span>

                {article && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 hidden sm:inline-block">
                    {article.category}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                AuraMed Peer-Reviewed Space Telemedicine Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title="Share article reference"
              className="p-2 rounded-lg bg-[#0B132B] hover:bg-[#1E3A5F] border border-[#1E3A5F] text-slate-300 hover:text-cyan-300 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#0B132B] hover:bg-rose-950/40 border border-[#1E3A5F] hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div ref={scrollContainerRef} className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1">
          {isLoading && (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div
                className={`w-12 h-12 border-3 border-t-transparent rounded-full animate-spin ${
                  isKids ? 'border-amber-400' : 'border-cyan-400'
                }`}
              />
              <p className="text-xs font-mono text-slate-400 uppercase tracking-widest animate-pulse">
                Decompressing Space Medicine Archive Telemetry...
              </p>
            </div>
          )}

          {error && (
            <div className="p-6 rounded-xl bg-rose-950/20 border border-rose-500/40 text-rose-300 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-mono font-bold text-sm">ARTICLE RETRIEVAL ERROR</h4>
                <p className="text-xs mt-1 text-slate-300">{error}</p>
                <Button variant="danger" size="sm" className="mt-3" onClick={onClose}>
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !error && article && (
            <>
              {/* Article Header Metadata */}
              <div className="space-y-4 pb-6 border-b border-[#1E3A5F]">
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-white font-medium">
                      {article.author?.name || 'Dr. Henrik Lindqvist'}
                    </span>
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(article.published_at)}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {article.reading_time_minutes} min read
                  </span>

                  <span className="flex items-center gap-1.5 text-cyan-400 bg-cyan-950/50 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                    <Eye className="w-3.5 h-3.5" />
                    {article.views_count} Reads
                  </span>
                </div>

                <h1
                  className={`text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight ${
                    isKids ? 'text-amber-300 font-sans' : 'text-white font-mono'
                  }`}
                >
                  {article.title}
                </h1>

                {/* Excerpt callout */}
                <div
                  className={`p-4 rounded-xl text-sm leading-relaxed border ${
                    isKids
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-100 font-sans'
                      : 'bg-[#050B14] border-[#1E3A5F] text-slate-300 font-mono italic'
                  }`}
                >
                  {article.excerpt}
                </div>
              </div>

              {/* Full Markdown Article Content */}
              <div className="py-2">
                <MarkdownArticleContent
                  content={article.content}
                  audience={article.target_audience}
                />
              </div>

              {/* Tags Section */}
              {article.tags && article.tags.length > 0 && (
                <div className="pt-6 border-t border-[#1E3A5F] flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1 mr-1">
                    <Tag className="w-3.5 h-3.5 text-cyan-400" />
                    TAGS:
                  </span>
                  {article.tags.map((t) => (
                    <span
                      key={t.id}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#050B14] text-slate-300 border border-[#1E3A5F] hover:border-cyan-400 transition-colors"
                    >
                      #{t.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Author & Verification Card */}
              <div className="p-4 rounded-xl bg-[#050B14] border border-[#1E3A5F] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center font-bold text-cyan-400">
                    {article.author?.name ? article.author.name.charAt(0) : 'A'}
                  </div>
                  <div>
                    <div className="text-white font-bold">
                      {article.author?.name || 'AuraMed Bioastronautics Staff'}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      NASA Ground Station Telemedicine Division
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-emerald-400 text-[11px] bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                  <Check className="w-3.5 h-3.5" />
                  PEER-REVIEWED & MEDICALLY VALIDATED
                </div>
              </div>

              {/* Related Articles Recommendation Section */}
              {relatedArticles.length > 0 && (
                <div className="pt-8 border-t border-[#1E3A5F] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText
                        className={`w-4 h-4 ${isKids ? 'text-amber-400' : 'text-cyan-400'}`}
                      />
                      <h3 className="text-sm font-mono font-bold text-white tracking-wider uppercase">
                        Recommended Exploration Readings ({relatedArticles.length})
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-slate-400">Same Audience Cadence</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {relatedArticles.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => onSelectArticle(rel.slug)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                          isKids
                            ? 'bg-[#050B14] border-amber-500/20 hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'bg-[#050B14] border-[#1E3A5F] hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                            <span
                              className={`font-bold ${
                                isKids ? 'text-amber-400' : 'text-cyan-400'
                              }`}
                            >
                              {rel.category || 'Space Science'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {rel.reading_time_minutes}m
                            </span>
                          </div>

                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 mb-2 leading-snug">
                            {rel.title}
                          </h4>

                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {rel.excerpt}
                          </p>
                        </div>

                        <div className="mt-4 pt-2 border-t border-slate-800/80 flex items-center justify-end text-[11px] font-mono text-cyan-400 group-hover:text-cyan-300">
                          Read Now <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#1E3A5F] bg-[#050B14]/90 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
          <span>AuraMed Biomedical Knowledge System</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close Reader
          </Button>
        </div>
      </div>
    </div>
  );
};
