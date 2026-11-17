import React, { useState } from 'react';
import {
  X,
  BookPlus,
  Sparkles,
  Activity,
  Tag,
  Clock,
  Eye,
  AlertCircle,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { Article } from '../../types/article.types';
import { articlesApi } from '../../api/articlesApi';
import { Button } from '../ui/Button';
import { MarkdownArticleContent } from './MarkdownArticleContent';

interface PublishArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArticleCreated: (article: Article) => void;
}

export const PublishArticleModal: React.FC<PublishArticleModalProps> = ({
  isOpen,
  onClose,
  onArticleCreated,
}) => {
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState<'kids' | 'adults'>('adults');
  const [category, setCategory] = useState('Cardiovascular Medicine');
  const [customCategory, setCustomCategory] = useState('');
  const [readingTime, setReadingTime] = useState<number>(5);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Bioastronautics', 'Space Medicine']);
  const [isPublished, setIsPublished] = useState(true);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const standardCategories = {
    kids: [
      'Daily Life in Space',
      'Space Physiology',
      'Space Botany',
      'Zero-G Physics',
      'Space Nutrition',
      'Space Technology',
      'Junior Astronaut Training',
    ],
    adults: [
      'Cardiovascular Medicine',
      'Neuro-Ophthalmology',
      'Radiation Oncology',
      'Musculoskeletal Medicine',
      'Immunology & Infectious Disease',
      'Neurobiology & Sleep Medicine',
      'Bio-Astronautics',
      'Spaceflight Operational Protocols',
    ],
  };

  const handleAudienceChange = (newAudience: 'kids' | 'adults') => {
    setAudience(newAudience);
    // set default category for chosen audience
    setCategory(newAudience === 'kids' ? 'Daily Life in Space' : 'Cardiovascular Medicine');
    if (newAudience === 'kids' && tags.includes('Bioastronautics')) {
      setTags(['Kids Science', 'Space Life']);
    } else if (newAudience === 'adults' && tags.includes('Kids Science')) {
      setTags(['Bioastronautics', 'Space Medicine']);
    }
  };

  const handleAddTag = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter' && e.key !== ',') return;
    if (e && 'key' in e) e.preventDefault();

    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const insertMarkdownSyntax = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('article-content-input') as HTMLTextAreaElement | null;
    if (!textarea) {
      setContent((prev) => prev + prefix + ' ' + suffix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = prefix + (selectedText || 'Text') + suffix;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Article title is required.');
      return;
    }

    if (!content.trim() || content.trim().length < 30) {
      setError('Article content must be at least 30 characters long.');
      return;
    }

    const finalCategory = customCategory.trim() || category;

    try {
      setIsSubmitting(true);
      const newArticle = await articlesApi.createArticle({
        title: title.trim(),
        target_audience: audience,
        category: finalCategory,
        reading_time_minutes: Number(readingTime) || 5,
        excerpt: excerpt.trim() || undefined as unknown as string,
        content: content.trim(),
        tags: tags.length > 0 ? tags : undefined,
        is_published: isPublished,
      });

      onArticleCreated(newArticle);
      onClose();
    } catch (err: unknown) {
      console.error('Failed to publish article:', err);
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to author article. Ensure you have educator/admin privileges.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#050B14]/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-[#0B132B] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.2)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E3A5F] bg-[#050B14]/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <BookPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-mono font-bold text-white tracking-wide">
                AUTHOR EDUCATIONAL ARTICLE
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Publish peer-reviewed research or junior cadet learning guides
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#0B132B] hover:bg-rose-950/40 border border-[#1E3A5F] hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Audience Selection */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              Target Audience Cadence <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleAudienceChange('kids')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  audience === 'kids'
                    ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)] text-white'
                    : 'bg-[#050B14] border-[#1E3A5F] text-slate-400 hover:text-white'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-amber-400 font-mono">Junior Cadets (Kids)</div>
                  <div className="text-[11px] text-slate-400">
                    Friendly emojis, fun facts, simplified space science
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAudienceChange('adults')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  audience === 'adults'
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_15px_rgba(0,229,255,0.25)] text-white'
                    : 'bg-[#050B14] border-[#1E3A5F] text-slate-400 hover:text-white'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-cyan-400 font-mono">
                    Clinical Flight Surgeons (Adults)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Peer-reviewed bio-astronautics, protocols, citations
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Article Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>
                Article Title <span className="text-rose-400">*</span>
              </span>
              <span className="text-[10px] text-slate-500">{title.length}/255</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                audience === 'kids'
                  ? 'e.g., Why Does Your Toothpaste Float in Orbit? 🪥'
                  : 'e.g., Cephalad Fluid Redistribution & Jugular Vein Thrombosis in Long-Duration ISS Rotation'
              }
              className="w-full px-4 py-2.5 rounded-xl bg-[#050B14] border border-[#1E3A5F] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Category & Read Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value !== 'custom') setCustomCategory('');
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              >
                {standardCategories[audience].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="custom">+ Custom Category...</option>
              </select>

              {category === 'custom' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category name..."
                  className="w-full mt-2 px-3 py-1.5 rounded-lg bg-[#050B14] border border-cyan-500/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Estimated Read Time (Minutes)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={readingTime}
                onChange={(e) => setReadingTime(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E3A5F] text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              Tags / Keywords
            </label>
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-[#050B14] border border-[#1E3A5F]">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-500/30"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-400 ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-1.5 flex-1 min-w-[160px]">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Type tag & press enter..."
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono py-1"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="p-1 rounded bg-[#1E3A5F] text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Short Overview / Excerpt</span>
              <span className="text-[10px] text-slate-500">{excerpt.length}/300</span>
            </label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A brief 1-2 sentence executive summary for the article card..."
              className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E3A5F] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Content Markdown with Toolbar & Preview Tab */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Article Body (Markdown) <span className="text-rose-400">*</span>
              </label>

              <div className="flex items-center gap-1 bg-[#050B14] p-1 rounded-lg border border-[#1E3A5F]">
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    activeTab === 'edit'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Write Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'preview'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3 h-3" /> Live Preview
                </button>
              </div>
            </div>

            {activeTab === 'edit' ? (
              <div className="space-y-2">
                {/* Markdown Quick Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-t-xl bg-[#050B14] border border-[#1E3A5F] border-b-0 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('## ')}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-[#1E3A5F] hover:text-white"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('### ')}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-[#1E3A5F] hover:text-white"
                  >
                    H3
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('**', '**')}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-[#1E3A5F] hover:text-white font-bold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('*', '*')}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-[#1E3A5F] hover:text-white italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('- ')}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-[#1E3A5F] hover:text-white"
                  >
                    • List
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('> ')}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-[#1E3A5F] hover:text-white"
                  >
                    &quot; Quote
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('> 💡 **Fun Fact**: ')}
                    className="px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 hover:bg-amber-900/50"
                  >
                    💡 Tip
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdownSyntax('```\n', '\n```')}
                    className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 hover:bg-[#1E3A5F]"
                  >
                    &lt;/&gt; Code
                  </button>
                </div>

                <textarea
                  id="article-content-input"
                  required
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    audience === 'kids'
                      ? '### Welcome Cadet! 🚀\n\nDid you know that in space...\n\n> 💡 **Fun Fact**: Sleeping in orbit is like floating on a cloud!\n\n- Fact 1\n- Fact 2'
                      : '## Clinical Overview\n\nSpaceflight-Associated Neuro-Ocular Syndrome (SANS)...\n\n### Pathophysiological Cascade\n1. Cephalad fluid redistribution\n2. Elevated optic sheath pressure\n\n> Clinical Guidance: Monitor OCT scans bi-weekly.'
                  }
                  className="w-full px-4 py-3 rounded-b-xl bg-[#050B14] border border-[#1E3A5F] text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 leading-relaxed"
                />
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-[#050B14] border border-[#1E3A5F] min-h-[250px] max-h-[400px] overflow-y-auto">
                {content.trim() ? (
                  <MarkdownArticleContent content={content} audience={audience} />
                ) : (
                  <div className="text-center py-12 text-slate-500 font-mono text-xs">
                    No content written yet. Switch to &quot;Write Markdown&quot; tab to begin authoring.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Publication Options */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#050B14] border border-[#1E3A5F]">
            <input
              type="checkbox"
              id="is-published"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 bg-[#0B132B] border-[#1E3A5F] focus:ring-cyan-400 focus:ring-offset-0"
            />
            <label htmlFor="is-published" className="text-xs font-mono text-slate-300 cursor-pointer">
              <span className="font-bold text-white">Publish Immediately</span> — Make visible to all
              crewmembers and public visitors on the AuraMed Knowledge Base.
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#1E3A5F] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Articles are logged into the cryptographic audit ledger.</span>
            </div>

            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={audience === 'kids' ? 'secondary' : 'primary'}
                size="md"
                isLoading={isSubmitting}
                className={audience === 'kids' ? 'text-amber-400 border-amber-500/50' : ''}
              >
                + Publish Article
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
