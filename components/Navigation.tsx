'use client';

import React from 'react';

interface NavigationProps {
  currentScene: number;
  onNavigate: (scene: number) => void;
}

export default function Navigation({ currentScene, onNavigate }: NavigationProps) {
  const links = [
    { label: 'Origin', scene: 0 },
    { label: 'Ingredients', scene: 1 },
    { label: 'Benefits', scene: 2 },
    { label: 'Sanctuary', scene: 3 },
  ];

  return (
    <header className="site-header" id="nav">
      <div className="nav-container">
        {/* Brand Logo */}
        <a
          href="#home"
          className="nav-brand"
          onClick={(e) => {
            e.preventDefault();
            onNavigate(0);
          }}
        >
          <span className="brand-title">VELORA</span>
          <span className="brand-sub">ARTISAN</span>
        </a>

        {/* Floating Glassmorphic Nav Links Pill */}
        <nav className="nav-pill-group">
          {links.map((link) => {
            const isActive = currentScene === link.scene;
            return (
              <button
                key={link.label}
                type="button"
                className={`nav-pill-item nav-link ${isActive ? 'active' : ''}`}
                data-scene={link.scene}
                onClick={() => onNavigate(link.scene)}
              >
                <span>{link.label}</span>
                {isActive && <span className="active-dot" />}
              </button>
            );
          })}
        </nav>

        {/* Right Action / CTA */}
        <div className="nav-actions">
          <button
            type="button"
            className="nav-cta-btn"
            onClick={() => onNavigate(3)}
          >
            <span>Sanctuary</span>
          </button>
        </div>
      </div>
    </header>
  );
}
