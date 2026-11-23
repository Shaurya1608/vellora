'use client';

import React from 'react';

export default function IngredientsLayer() {
  const chips = [
    { id: 'chip0', cropId: 'crop-acacia', name: 'Wild Acacia', desc: 'Floral nectar' },
    { id: 'chip1', cropId: 'crop-lavender', name: 'Lavender', desc: 'Calms & soothes' },
    { id: 'chip2', cropId: 'crop-blueberry', name: 'Wild Blueberries', desc: 'Handpicked & Raw' },
    { id: 'chip3', cropId: 'crop-honeycomb', name: 'Honeycomb', desc: 'Seals in the flavor' },
    { id: 'chip4', cropId: 'crop-pollen', name: 'Bee Pollen', desc: 'Protein & Zinc' },
  ];

  return (
    <div className="layer-ingr" id="layerIngr">
      {chips.map((ch) => (
        <div className="chip" id={ch.id} key={ch.id}>
          <div className="in-w">
            <div className="chip-circle">
              <i id={ch.cropId} />
            </div>
            <span className="chip-name">{ch.name}</span>
            <span className="chip-desc">{ch.desc}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
