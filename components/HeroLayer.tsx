'use client';

import React from 'react';

interface HeroLayerProps {
  wordmarkRef: React.RefObject<HTMLHeadingElement>;
  heroFrameRef: React.RefObject<HTMLDivElement>;
  vidARef: React.RefObject<HTMLVideoElement>;
  vidBRef: React.RefObject<HTMLVideoElement>;
}

export default function HeroLayer({
  wordmarkRef,
  heroFrameRef,
  vidARef,
  vidBRef,
}: HeroLayerProps) {
  return (
    <div className="layer-hero" id="layerHero">
      <div className="frame hero-frame" id="heroFrame" ref={heroFrameRef}>
        <img
          className="hero-plate"
          id="heroPlate"
          src="/assets/meadow_hero_plate.jpg"
          alt="Velora Raw Honey and Wild Jam on Meadow Stone"
        />
        <div className="hero-haze-overlay" />
        <video
          className="hero-video vid-a"
          id="heroVidA"
          ref={vidARef}
          muted
          playsInline
          preload="auto"
          style={{ display: 'none' }}
        />
        <video
          className="hero-video vid-b"
          id="heroVidB"
          ref={vidBRef}
          muted
          playsInline
          preload="auto"
          style={{ display: 'none' }}
        />
      </div>
      <h1 className="wordmark" id="wordmark" ref={wordmarkRef}>
        VELORA
      </h1>
    </div>
  );
}
