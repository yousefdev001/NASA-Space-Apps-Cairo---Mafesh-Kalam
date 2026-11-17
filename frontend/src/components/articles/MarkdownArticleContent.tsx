import React from 'react';
import { Sparkles, Activity, Quote, Lightbulb } from 'lucide-react';

interface MarkdownArticleContentProps {
  content: string;
  audience: 'kids' | 'adults';
}

export const MarkdownArticleContent: React.FC<MarkdownArticleContentProps> = ({
  content,
  audience,
}) => {
  // Parse paragraphs and basic markdown constructs
  const blocks = content.split('\n\n').map((b) => b.trim()).filter(Boolean);

  const renderInlineFormatted = (text: string) => {
    // Process bold (**text**), italics (*text*), inline code (`code`)
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Check for bold **...**
      const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)$/s);
      if (boldMatch) {
        if (boldMatch[1]) parts.push(<span key={keyIdx++}>{boldMatch[1]}</span>);
        parts.push(
          <strong
            key={keyIdx++}
            className={
              audience === 'kids'
                ? 'font-bold text-amber-300'
                : 'font-semibold text-cyan-300 font-mono text-[0.95em]'
            }
          >
            {boldMatch[2]}
          </strong>
        );
        remaining = boldMatch[3];
        continue;
      }

      // Check for code `...`
      const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/s);
      if (codeMatch) {
        if (codeMatch[1]) parts.push(<span key={keyIdx++}>{codeMatch[1]}</span>);
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 rounded bg-[#050B14] border border-cyan-500/30 text-cyan-300 font-mono text-xs"
          >
            {codeMatch[2]}
          </code>
        );
        remaining = codeMatch[3];
        continue;
      }

      // Check for italic *...*
      const italicMatch = remaining.match(/^(.*?)\*([^*]+)\*(.*)$/s);
      if (italicMatch) {
        if (italicMatch[1]) parts.push(<span key={keyIdx++}>{italicMatch[1]}</span>);
        parts.push(
          <em key={keyIdx++} className="italic text-slate-200">
            {italicMatch[2]}
          </em>
        );
        remaining = italicMatch[3];
        continue;
      }

      // No more inline matches
      parts.push(<span key={keyIdx++}>{remaining}</span>);
      break;
    }

    return parts;
  };

  return (
    <div className="space-y-5 leading-relaxed text-slate-300 font-sans text-sm sm:text-base">
      {blocks.map((block, idx) => {
        // H1 header (# )
        if (block.startsWith('# ')) {
          return (
            <h1
              key={idx}
              className={`text-2xl sm:text-3xl font-bold tracking-tight pb-2 border-b ${
                audience === 'kids'
                  ? 'text-amber-300 border-amber-500/30 font-sans'
                  : 'text-white border-[#1E3A5F] font-mono'
              }`}
            >
              {block.replace(/^#\s+/, '')}
            </h1>
          );
        }

        // H2 header (## )
        if (block.startsWith('## ')) {
          return (
            <h2
              key={idx}
              className={`text-xl sm:text-2xl font-bold mt-6 pt-2 flex items-center gap-2 ${
                audience === 'kids'
                  ? 'text-amber-400 font-sans'
                  : 'text-cyan-400 font-mono border-l-2 border-cyan-500 pl-3'
              }`}
            >
              {audience === 'kids' && <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />}
              {audience === 'adults' && <Activity className="w-4 h-4 text-cyan-400 shrink-0" />}
              {block.replace(/^##\s+/, '')}
            </h2>
          );
        }

        // H3 header (### )
        if (block.startsWith('### ')) {
          return (
            <h3
              key={idx}
              className={`text-lg sm:text-xl font-bold mt-4 ${
                audience === 'kids' ? 'text-amber-200' : 'text-slate-100 font-mono'
              }`}
            >
              {block.replace(/^###\s+/, '')}
            </h3>
          );
        }

        // H4 header (#### )
        if (block.startsWith('#### ')) {
          return (
            <h4
              key={idx}
              className={`text-base font-bold mt-3 uppercase tracking-wider ${
                audience === 'kids' ? 'text-amber-300/90' : 'text-cyan-300 font-mono text-xs'
              }`}
            >
              {block.replace(/^####\s+/, '')}
            </h4>
          );
        }

        // Code block (``` ... ```)
        if (block.startsWith('```')) {
          const lines = block.split('\n');
          const codeContent = lines.slice(1, -1).join('\n');
          return (
            <pre
              key={idx}
              className="p-4 rounded-xl bg-[#050B14] border border-[#1E3A5F] overflow-x-auto text-xs font-mono text-cyan-300/90 leading-normal"
            >
              <code>{codeContent}</code>
            </pre>
          );
        }

        // Blockquote (> ...)
        if (block.startsWith('>')) {
          const quoteText = block
            .split('\n')
            .map((line) => line.replace(/^>\s?/, ''))
            .join(' ');

          if (audience === 'kids') {
            return (
              <div
                key={idx}
                className="my-4 p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-start gap-3"
              >
                <Lightbulb className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm sm:text-base leading-relaxed">
                  {renderInlineFormatted(quoteText)}
                </div>
              </div>
            );
          }

          return (
            <div
              key={idx}
              className="my-4 p-4 rounded-xl bg-cyan-950/20 border-l-4 border-cyan-400 border-y border-r border-[#1E3A5F] text-slate-200 flex items-start gap-3"
            >
              <Quote className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-sm font-mono leading-relaxed">
                {renderInlineFormatted(quoteText)}
              </div>
            </div>
          );
        }

        // Unordered list (- or *)
        if (block.split('\n').every((l) => /^[-*]\s+/.test(l.trim()))) {
          const items = block
            .split('\n')
            .map((l) => l.trim().replace(/^[-*]\s+/, ''))
            .filter(Boolean);

          return (
            <ul key={idx} className="space-y-2 my-3 pl-2">
              {items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2.5">
                  <span
                    className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                      audience === 'kids' ? 'bg-amber-400' : 'bg-cyan-400 shadow-[0_0_6px_#00e5ff]'
                    }`}
                  />
                  <div className="flex-1 leading-relaxed">{renderInlineFormatted(item)}</div>
                </li>
              ))}
            </ul>
          );
        }

        // Ordered list (1. 2. 3.)
        if (block.split('\n').every((l) => /^\d+\.\s+/.test(l.trim()))) {
          const items = block
            .split('\n')
            .map((l) => l.trim().replace(/^\d+\.\s+/, ''))
            .filter(Boolean);

          return (
            <ol key={idx} className="space-y-2.5 my-3 pl-1">
              {items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-3">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono font-bold shrink-0 mt-0.5 ${
                      audience === 'kids'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    {itemIdx + 1}
                  </span>
                  <div className="flex-1 leading-relaxed">{renderInlineFormatted(item)}</div>
                </li>
              ))}
            </ol>
          );
        }

        // Default Paragraph
        return (
          <p
            key={idx}
            className={`leading-relaxed ${
              audience === 'kids'
                ? 'text-slate-200 font-sans'
                : 'text-slate-300 font-sans tracking-wide'
            }`}
          >
            {renderInlineFormatted(block)}
          </p>
        );
      })}
    </div>
  );
};
