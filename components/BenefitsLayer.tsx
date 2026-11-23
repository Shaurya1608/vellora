'use client';

import React from 'react';

interface BenefitsLayerProps {
  beneRowsRef: React.RefObject<HTMLDivElement>;
}

export default function BenefitsLayer({ beneRowsRef }: BenefitsLayerProps) {
  const rows = [
    {
      cropId: 'crop-energy',
      title: 'Clean Energy',
      desc: 'Natural sugars give steady energy that lasts all through the day.',
    },
    {
      cropId: 'crop-throat',
      title: 'Soothes Throat',
      desc: 'One warm spoonful coats and calms a dry, tired throat.',
    },
    {
      cropId: 'crop-raw',
      title: 'Raw & Unfiltered',
      desc: 'Never heated or filtered, so each enzyme and pollen grain is kept.',
    },
  ];

  return (
    <div className="layer-bene" id="layerBene">
      <div className="rows" id="beneRows" ref={beneRowsRef}>
        {rows.map((row, idx) => (
          <div className="row" key={idx}>
            <div className="row-thumb">
              <i id={row.cropId} />
            </div>
            <div className="row-text">
              <h3>{row.title}</h3>
              <p>{row.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
