'use client';

import React from 'react';

interface SceneLayerProps {
  onDiscover: () => void;
}

export default function SceneLayer({ onDiscover }: SceneLayerProps) {
  return (
    <div className="layer-scene" id="layerScene">
      <img
        className="scene-plate"
        src="/assets/forest_scene_plate.jpg"
        alt="Velora Forest Sanctuary"
      />
      <div className="cta-col">
        <h2 className="tagline">
          FROM NATURE,
          <br />
          STRAIGHT TO YOU.
        </h2>
      </div>
      <a
        href="#home"
        className="discover-btn"
        id="discoverBtn"
        onClick={(e) => {
          e.preventDefault();
          onDiscover();
        }}
      >
        Discover
      </a>
    </div>
  );
}
