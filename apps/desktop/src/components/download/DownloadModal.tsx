import React, { useState } from 'react';
import { X, Apple, Smartphone, Download, ExternalLink, ShieldCheck, Wifi, Copy, Check } from 'lucide-react';
import { getBaseUrl } from '../../services/api';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const baseUrl = getBaseUrl();
  const androidDownloadUrl = `${baseUrl}/api/download/android`;
  const macDownloadUrl = `${baseUrl}/api/download/mac`;

  const copyMobileLink = () => {
    navigator.clipboard.writeText(androidDownloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          background: '#0d0f17',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(244, 63, 94, 0.15)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f43f5e'
              }}
            >
              <Download size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
                Download FRIDAY Apps
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Direct, zero-login downloads from your local FRIDAY server
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Download Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            
            {/* 🍎 macOS Desktop Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff'
                  }}
                >
                  <Apple size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>macOS App</h3>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>v0.1.0 • Universal Mac</span>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
                Frameless glass HUD, Global Hotkey (<code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 4px', borderRadius: '4px' }}>Cmd+Shift+Space</code>), and Menu Bar Tray.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <a
                  href={macDownloadUrl}
                  download="FRIDAY-macOS-Universal.tar.gz"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#f43f5e',
                    color: '#ffffff',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(244, 63, 94, 0.35)'
                  }}
                >
                  <Download size={15} />
                  <span>Download for Mac (.tar.gz)</span>
                </a>
              </div>
            </div>

            {/* 🤖 Android Mobile Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981'
                  }}
                >
                  <Smartphone size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Android APK</h3>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>v0.1.0 • ARM64</span>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
                Direct mic voice recognition, mobile touch gesture navigation, and local LAN AI synchronization.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <a
                  href={androidDownloadUrl}
                  download="FRIDAY-Android-v0.1.0.apk"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#10b981',
                    color: '#ffffff',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <Download size={15} />
                  <span>Download APK (Direct)</span>
                </a>
              </div>
            </div>

          </div>

          {/* Wi-Fi Local Network Download Box for Mobile Phone */}
          <div
            style={{
              padding: '14px 18px',
              background: 'rgba(56, 189, 248, 0.06)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wifi size={16} color="#38bdf8" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                  Download on Phone (Wi-Fi Direct URL)
                </span>
              </div>
              <button
                onClick={copyMobileLink}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '11px',
                  padding: '4px 10px',
                  cursor: 'pointer'
                }}
              >
                {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
              Open this link on your phone's browser to download the APK directly:
            </p>
            <code style={{ fontSize: '12px', color: '#ffffff', background: 'rgba(0, 0, 0, 0.4)', padding: '6px 10px', borderRadius: '6px', wordBreak: 'break-all' }}>
              {androidDownloadUrl}
            </code>
          </div>

          {/* Direct GitHub Release Link Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#94a3b8'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="#10b981" />
              <span>Served directly from your local server. Zero authentication required.</span>
            </div>

            <a
              href="https://github.com/OK45batwal/FRIDAY/releases"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#f43f5e',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <span>GitHub Releases</span>
              <ExternalLink size={12} />
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};
