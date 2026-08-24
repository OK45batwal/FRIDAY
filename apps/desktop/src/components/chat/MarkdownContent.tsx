import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  if (!content) return null;

  // Helper to render code block with copy button
  const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div
        style={{
          margin: '12px 0',
          borderRadius: '10px',
          overflow: 'hidden',
          background: 'rgba(5, 7, 13, 0.95)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Code Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '7px 14px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'monospace'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={12} color="var(--accent-rose)" />
            <span style={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
              {language || 'plaintext'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              color: copied ? 'var(--accent-emerald)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'inherit',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
            title="Copy code to clipboard"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Code Content */}
        <pre
          style={{
            margin: 0,
            padding: '14px 16px',
            overflowX: 'auto',
            fontSize: '13px',
            lineHeight: '1.6',
            color: '#e2e8f0',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            whiteSpace: 'pre'
          }}
        >
          <code>{code}</code>
        </pre>
      </div>
    );
  };

  // Parse lines and blocks
  const renderFormattedBlocks = (text: string) => {
    // Split by code blocks ```lang ... ```
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Text before code block
      if (match.index > lastIndex) {
        const textChunk = text.slice(lastIndex, match.index);
        elements.push(<span key={`text-${lastIndex}`}>{renderTextContent(textChunk)}</span>);
      }

      const lang = match[1] || 'plaintext';
      const code = match[2].trimEnd();
      elements.push(<CodeBlock key={`code-${match.index}`} code={code} language={lang} />);

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      elements.push(<span key={`text-end`}>{renderTextContent(text.slice(lastIndex))}</span>);
    }

    return elements;
  };

  // Helper for inline text formatting (bold, italic, inline code, headers, bullets, tables)
  const renderTextContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      // Headers
      if (line.startsWith('### ')) {
        return (
          <h3
            key={lineIdx}
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '14px 0 6px 0',
              letterSpacing: '-0.3px'
            }}
          >
            {renderInline(line.slice(4))}
          </h3>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2
            key={lineIdx}
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '16px 0 8px 0',
              letterSpacing: '-0.4px'
            }}
          >
            {renderInline(line.slice(3))}
          </h2>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h1
            key={lineIdx}
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '18px 0 10px 0',
              letterSpacing: '-0.5px'
            }}
          >
            {renderInline(line.slice(2))}
          </h1>
        );
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        return (
          <blockquote
            key={lineIdx}
            style={{
              borderLeft: '3px solid var(--accent-rose)',
              paddingLeft: '12px',
              margin: '8px 0',
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              background: 'rgba(244, 63, 94, 0.04)',
              padding: '6px 12px',
              borderRadius: '0 6px 6px 0'
            }}
          >
            {renderInline(line.slice(2))}
          </blockquote>
        );
      }

      // Bullet lists
      if (/^[-*]\s+/.test(line)) {
        return (
          <div
            key={lineIdx}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              margin: '4px 0',
              paddingLeft: '4px'
            }}
          >
            <span style={{ color: 'var(--accent-rose)', fontSize: '14px', lineHeight: 1 }}>•</span>
            <span style={{ flex: 1 }}>{renderInline(line.replace(/^[-*]\s+/, ''))}</span>
          </div>
        );
      }

      // Numbered lists
      const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        return (
          <div
            key={lineIdx}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              margin: '4px 0',
              paddingLeft: '4px'
            }}
          >
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '12px' }}>{numMatch[1]}.</span>
            <span style={{ flex: 1 }}>{renderInline(numMatch[2])}</span>
          </div>
        );
      }

      // Standard paragraph line
      return (
        <div key={lineIdx} style={{ minHeight: line.trim() ? 'auto' : '8px', margin: '2px 0' }}>
          {renderInline(line)}
        </div>
      );
    });
  };

  // Helper for inline spans (bold, inline code, italics, math)
  const renderInline = (str: string) => {
    // Regex for inline code `...`, bold **...**, italics *...*, and math $...$
    const tokens = str.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\$[^\$]+\$)/g);

    return tokens.map((tok, idx) => {
      if (tok.startsWith('`') && tok.endsWith('`') && tok.length >= 2) {
        return (
          <code
            key={idx}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '12.5px',
              fontFamily: 'monospace',
              color: 'var(--accent-rose)'
            }}
          >
            {tok.slice(1, -1)}
          </code>
        );
      }
      if (tok.startsWith('**') && tok.endsWith('**') && tok.length >= 4) {
        return (
          <strong key={idx} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {tok.slice(2, -2)}
          </strong>
        );
      }
      if (tok.startsWith('*') && tok.endsWith('*') && tok.length >= 2 && !tok.startsWith('**')) {
        return (
          <em key={idx} style={{ color: 'var(--text-secondary)' }}>
            {tok.slice(1, -1)}
          </em>
        );
      }
      if (tok.startsWith('$') && tok.endsWith('$') && tok.length >= 2) {
        return (
          <span
            key={idx}
            style={{
              fontFamily: 'serif',
              fontStyle: 'italic',
              color: 'var(--accent-cyan)',
              padding: '0 2px'
            }}
          >
            {tok.slice(1, -1)}
          </span>
        );
      }
      return tok;
    });
  };

  return (
    <div
      style={{
        fontSize: '14px',
        lineHeight: '1.65',
        color: 'var(--text-primary)',
        wordBreak: 'break-word'
      }}
    >
      {renderFormattedBlocks(content)}
    </div>
  );
};
