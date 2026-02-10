'use client';

import { useState, useEffect } from 'react';

export default function Presentation({ onComplete }: { onComplete: () => void }) {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState(1); // 1: primera frase, 2: segunda frase

  useEffect(() => {
    setShow(true);
    
    // Después de 2.5 segundos, mostrar segunda frase
    const timer1 = setTimeout(() => {
      setPhase(2);
    }, 2500);
    
    // Después de 5 segundos total, pasar al juego
    const timer2 = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-200 via-pink-100 to-rose-200 flex items-center justify-center overflow-hidden" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* Wood texture overlay */}
      <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(90deg,#8B4513_0px,#8B4513_2px,transparent_2px,transparent_8px)]"></div>
      
      {/* Flowers in corners */}
      <div className="absolute top-2 left-2 md:top-4 md:left-4 text-3xl md:text-6xl animate-bounce">🌸</div>
      <div className="absolute top-2 right-2 md:top-4 md:right-4 text-3xl md:text-6xl animate-bounce delay-100">🌺</div>
      <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 text-3xl md:text-6xl animate-bounce delay-200">🌷</div>
      <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 text-3xl md:text-6xl animate-bounce delay-300">🌹</div>
      
      {/* Main message */}
      <div className={`text-center z-10 transition-all duration-1000 px-4 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        {phase === 1 ? (
          <>
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-pink-600 mb-4 drop-shadow-lg" style={{ fontFamily: 'cursive' }}>
              Buenos días preciosa
            </h1>
            <div className="text-5xl md:text-8xl animate-pulse">💖</div>
          </>
        ) : (
          <>
            <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-purple-600 mb-4 drop-shadow-lg animate-bounce" style={{ fontFamily: 'cursive' }}>
              Hoy es un buen día para...
            </h1>
            <div className="text-6xl md:text-9xl animate-ping">🎮</div>
          </>
        )}
      </div>

      {/* Floating hearts */}
      <div className="absolute bottom-0 left-0 right-0 h-full pointer-events-none">
        <div className="heart-float heart-1">💗</div>
        <div className="heart-float heart-2">💕</div>
        <div className="heart-float heart-3">💝</div>
        <div className="heart-float heart-4">💖</div>
      </div>

      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(100vh) translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) translateX(20px);
            opacity: 0;
          }
        }

        .heart-float {
          position: absolute;
          font-size: 2rem;
          animation: float-up 6s infinite;
        }

        .heart-1 {
          left: 20%;
          animation-delay: 0s;
        }

        .heart-2 {
          left: 40%;
          animation-delay: 1.5s;
        }

        .heart-3 {
          left: 60%;
          animation-delay: 3s;
        }

        .heart-4 {
          left: 80%;
          animation-delay: 4.5s;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-300 {
          animation-delay: 0.3s;
        }
      `}</style>
    </div>
  );
}
