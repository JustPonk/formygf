'use client';

import { useState } from 'react';
import Presentation from './components/Presentation';
import MiniTransformice from './components/MiniTransformice';

export default function Home() {
  const [showPresentation, setShowPresentation] = useState(true);

  return (
    <div>
      {showPresentation ? (
        <Presentation onComplete={() => setShowPresentation(false)} />
      ) : (
        <MiniTransformice />
      )}
    </div>
  );
}
