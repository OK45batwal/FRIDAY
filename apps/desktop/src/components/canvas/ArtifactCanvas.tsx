import React, { useState } from 'react';
import { X, Copy, Check, Play, Download, Maximize2, Minimize2, Code2 } from 'lucide-react';

export interface ArtifactItem {
  id: string;
  title: string;
  language: string;
  content: string;
  type?: 'code' | 'markdown' | 'diagram' | 'html';
}

interface ArtifactCanvasProps {
  artifact: ArtifactItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRunCode?: (code: string, language: string) => void;
}

export const ArtifactCanvas: React.FC<ArtifactCanvasProps> = ({
  artifact,
  isOpen,
  onClose,
  onRunCode
}) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);


  if (!isOpen || !artifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = artifact.language === 'python' ? '.py' : artifact.language === 'typescript' ? '.ts' : artifact.language === 'javascript' ? '.js' : artifact.language === 'html' ? '.html' : '.txt';
    const filename = `${artifact.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}${ext}`;
    const blob = new Blob([artifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const lines = artifact.content.split('\n');

  return (
    <div
      style={{
        width: isFullscreen ? '100vw' : '480px',
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9000 : 30,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-card)',
        borderLeft: '1px solid var(--border-subtle)',
        boxShadow: '-4px 0 25px rgba(0, 0, 0, 0.3)',
        transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.15)',
              color: 'var(--accent-rose)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Code2 size={16} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {artifact.title}
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {artifact.language} • {lines.length} lines
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onRunCode && (
            <button
              type="button"
              onClick={() => onRunCode(artifact.content, artifact.language)}
              className="btn-action-icon"
              style={{
                color: 'var(--accent-emerald)',
                background: 'rgba(16, 185, 129, 0.12)',
                padding: '5px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                gap: '4px'
              }}
              title="Run code"
            >
              <Play size={12} fill="var(--accent-emerald)" />
              <span>RUN</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="btn-action-icon"
            style={{ padding: '6px', borderRadius: '6px' }}
            title="Copy all code"
          >
            {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="btn-action-icon"
            style={{ padding: '6px', borderRadius: '6px' }}
            title="Download file"
          >
            <Download size={14} />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn-action-icon"
            style={{ padding: '6px', borderRadius: '6px' }}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn-action-icon"
            style={{ padding: '6px', borderRadius: '6px' }}
            title="Close Canvas"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Code Editor Body with Line Numbers */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          background: 'rgba(5, 7, 13, 0.96)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          fontSize: '12.5px',
          lineHeight: '1.65',
          display: 'flex'
        }}
      >
        {/* Line Numbers Gutter */}
        <div
          style={{
            padding: '16px 10px',
            textAlign: 'right',
            color: 'rgba(255, 255, 255, 0.25)',
            userSelect: 'none',
            borderRight: '1px solid var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.2)',
            minWidth: '42px'
          }}
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code Content */}
        <pre
          style={{
            margin: 0,
            padding: '16px 20px',
            color: '#f8fafc',
            flex: 1,
            whiteSpace: 'pre',
            wordBreak: 'normal',
            tabSize: 2
          }}
        >
          <code>{artifact.content}</code>
        </pre>
      </div>
    </div>
  );
};
