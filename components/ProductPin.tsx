'use client';

import React from 'react';

interface ProductPinProps {
  jarRef: React.RefObject<HTMLImageElement>;
  handRef: React.RefObject<HTMLImageElement>;
}

export default function ProductPin({ jarRef, handRef }: ProductPinProps) {
  return (
    <>
      <img
        className="jar-img"
        id="jarImg"
        ref={jarRef}
        src="/assets/velora_jar.png"
        alt="Velora Artisan Wild Blueberry Jam"
      />
      <img
        className="hand-img"
        id="handImg"
        ref={handRef}
        src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261123_061028_dd300bd1-4172-4809-abac-c1b9e7660381.png&w=1024&q=85"
        alt="Presenting Hand"
        crossOrigin="anonymous"
      />
    </>
  );
}
