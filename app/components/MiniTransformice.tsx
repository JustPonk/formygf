'use client';

import { useState, useEffect, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Velocity {
  x: number;
  y: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: 'normal' | 'heart' | 'castle';
}

interface Decoration {
  x: number;
  y: number;
  type: 'heart' | 'flower' | 'tree';
}

type GamePhase = 'phase1' | 'transition-close' | 'transition-open' | 'phase2' | 'transition2-close' | 'transition2-open' | 'cinematic' | 'zoom-in' | 'dialogue';

export default function MiniTransformice() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(true);
  const [phase, setPhase] = useState<GamePhase>('phase1');
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [cinematicProgress, setCinematicProgress] = useState(0);
  const [zoomProgress, setZoomProgress] = useState(0);
  const [dialogueStep, setDialogueStep] = useState(0);
  const [showExclamation, setShowExclamation] = useState(false);
  const [boyMouseInRoom, setBoyMouseInRoom] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [deathCount, setDeathCount] = useState(0);
  
  // Game state refs
  const mousePos = useRef<Position>({ x: 100, y: 450 });
  const velocity = useRef<Velocity>({ x: 0, y: 0 });
  const cameraX = useRef(0);
  const isOnGround = useRef(false);
  const keys = useRef<{ [key: string]: boolean }>({});
  const animationFrame = useRef<number | undefined>(undefined);
  
  // Touch controls refs
  const touchLeft = useRef(false);
  const touchRight = useRef(false);
  const touchJump = useRef(false);

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_FORCE = -12;
  const MOVE_SPEED = 5;
  const MOUSE_SIZE = 30;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const MAP_WIDTH = 3500; // Mapa extenso para 1+ minuto

  // Fase 1: Camino hacia el castillo con tema San Valentín
  const platformsPhase1: Platform[] = [
    // Suelo base con huecos
    { x: 0, y: 550, width: 600, height: 50, type: 'normal' },
    // HUECO 1 (x: 600-750)
    { x: 750, y: 550, width: 350, height: 50, type: 'normal' },
    // HUECO 2 (x: 1100-1250)
    { x: 1250, y: 550, width: 450, height: 50, type: 'normal' },
    // HUECO 3 (x: 1700-1900)
    { x: 1900, y: 550, width: 400, height: 50, type: 'normal' },
    // HUECO 4 (x: 2300-2500)
    { x: 2500, y: 550, width: 500, height: 50, type: 'normal' },
    
    // Plataformas iniciales
    { x: 250, y: 480, width: 120, height: 15, type: 'heart' },
    { x: 450, y: 420, width: 100, height: 15, type: 'heart' },
    { x: 650, y: 360, width: 120, height: 15, type: 'heart' },
    { x: 850, y: 420, width: 100, height: 15, type: 'normal' },
    
    // Sección de corazones flotantes
    { x: 1000, y: 480, width: 80, height: 15, type: 'heart' },
    { x: 1150, y: 440, width: 80, height: 15, type: 'heart' },
    { x: 1300, y: 400, width: 80, height: 15, type: 'heart' },
    { x: 1450, y: 360, width: 80, height: 15, type: 'heart' },
    
    // Bajada
    { x: 1600, y: 420, width: 150, height: 15, type: 'normal' },
    { x: 1800, y: 480, width: 150, height: 15, type: 'normal' },
    
    // Obstáculos finales
    { x: 2000, y: 450, width: 100, height: 15, type: 'heart' },
    { x: 2180, y: 400, width: 100, height: 15, type: 'heart' },
    { x: 2360, y: 350, width: 100, height: 15, type: 'heart' },
    { x: 2540, y: 450, width: 120, height: 15, type: 'normal' },
    
    // Plataforma antes del castillo
    { x: 2750, y: 500, width: 200, height: 15, type: 'normal' },
    
    // Castillo base
    { x: 3000, y: 550, width: 500, height: 50, type: 'castle' },
  ];

  // Fase 2: Dentro del castillo (gótico oscuro)
  const platformsPhase2: Platform[] = [
    // Suelo del castillo con huecos
    { x: 0, y: 550, width: 400, height: 50, type: 'castle' },
    // HUECO 1 (x: 400-550)
    { x: 550, y: 550, width: 350, height: 50, type: 'castle' },
    // HUECO 2 (x: 900-1050)
    { x: 1050, y: 550, width: 300, height: 50, type: 'castle' },
    // HUECO 3 (x: 1350-1500)
    { x: 1500, y: 550, width: 400, height: 50, type: 'castle' },
    // HUECO 4 (x: 1900-2100)
    { x: 2100, y: 550, width: 400, height: 50, type: 'castle' },
    { x: 2500, y: 550, width: 1000, height: 50, type: 'castle' },
    
    // Plataformas interiores
    { x: 200, y: 480, width: 120, height: 15, type: 'castle' },
    { x: 600, y: 420, width: 100, height: 15, type: 'castle' },
    { x: 800, y: 360, width: 120, height: 15, type: 'castle' },
    { x: 1100, y: 420, width: 100, height: 15, type: 'castle' },
    { x: 1400, y: 480, width: 80, height: 15, type: 'castle' },
    { x: 1600, y: 400, width: 120, height: 15, type: 'castle' },
    { x: 1850, y: 450, width: 100, height: 15, type: 'castle' },
    { x: 2200, y: 380, width: 150, height: 15, type: 'castle' },
    { x: 2600, y: 480, width: 120, height: 15, type: 'castle' },
  ];

  const platforms = phase === 'phase1' ? platformsPhase1 : platformsPhase2;

  // Decoraciones de San Valentín
  const decorations: Decoration[] = [
    { x: 200, y: 520, type: 'flower' },
    { x: 400, y: 520, type: 'heart' },
    { x: 600, y: 520, type: 'flower' },
    { x: 800, y: 520, type: 'heart' },
    { x: 1100, y: 520, type: 'flower' },
    { x: 1400, y: 520, type: 'heart' },
    { x: 1700, y: 520, type: 'flower' },
    { x: 2000, y: 520, type: 'heart' },
    { x: 2300, y: 520, type: 'flower' },
    { x: 2600, y: 520, type: 'heart' },
  ];

  // Posición del castillo y puerta (más alto y gótico)
  const castlePos = { x: 3100, y: 200 };
  const castleDoorPos = { x: 3150, y: 480 };
  const phase2EndPos = { x: 3300, y: 400 }; // Posición de fin de fase 2
  
  const spawnPoint = { x: 100, y: 450 };

  // Transición de círculo
  useEffect(() => {
    if (phase === 'transition-close') {
      const interval = setInterval(() => {
        setTransitionProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setPhase('transition-open');
            return 100;
          }
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    } else if (phase === 'transition-open') {
      const interval = setInterval(() => {
        setTransitionProgress((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            setPhase('phase2');
            mousePos.current = { x: 200, y: 450 }; // Posición inicial fase 2 dentro del castillo
            cameraX.current = 0;
            return 0;
          }
          return prev - 2;
        });
      }, 30);
      return () => clearInterval(interval);
    } else if (phase === 'transition2-close') {
      const interval = setInterval(() => {
        setTransitionProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setPhase('transition2-open');
            return 100;
          }
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    } else if (phase === 'transition2-open') {
      const interval = setInterval(() => {
        setTransitionProgress((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            setPhase('cinematic');
            setCinematicProgress(0);
            return 0;
          }
          return prev - 2;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Cinemática animation
  useEffect(() => {
    if (phase === 'cinematic') {
      const interval = setInterval(() => {
        setCinematicProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setPhase('zoom-in');
            setZoomProgress(0);
            return 100;
          }
          return prev + 0.5; // Lento para que dure ~20 segundos
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Zoom animation hacia la habitación
  useEffect(() => {
    if (phase === 'zoom-in') {
      const interval = setInterval(() => {
        setZoomProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setPhase('dialogue');
            setDialogueStep(0);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Diálogo sequence
  useEffect(() => {
    if (phase === 'dialogue') {
      if (dialogueStep === 0) {
        // Mostrar "DIANAAAAAAAAAAA" por 3 segundos
        const timer = setTimeout(() => {
          setDialogueStep(1);
          setShowExclamation(true);
          // Animación de salto
          setTimeout(() => {
            setShowExclamation(false);
            setDialogueStep(2);
            // Esperar 3 segundos antes de que entre el ratón
            setTimeout(() => {
              setBoyMouseInRoom(true);
              setDialogueStep(3);
            }, 3000);
          }, 1000); // Duración del salto
        }, 5000); // Mostrar mensaje más tiempo (5 segundos)
        return () => clearTimeout(timer);
      }
    }
  }, [phase, dialogueStep]);

  useEffect(() => {
    if (!gameStarted) return;
    if (phase !== 'phase1' && phase !== 'phase2') return;
    if (isDead) return; // No ejecutar el game loop si está muerto

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle keyboard input
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Game loop
    const gameLoop = () => {
      // Handle input (keyboard + touch)
      if (keys.current['ArrowLeft'] || keys.current['a'] || touchLeft.current) {
        velocity.current.x = -MOVE_SPEED;
      } else if (keys.current['ArrowRight'] || keys.current['d'] || touchRight.current) {
        velocity.current.x = MOVE_SPEED;
      } else {
        velocity.current.x *= 0.8; // Friction
      }

      if ((keys.current[' '] || keys.current['ArrowUp'] || keys.current['w'] || touchJump.current) && isOnGround.current) {
        velocity.current.y = JUMP_FORCE;
        isOnGround.current = false;
      }

      // Apply gravity
      velocity.current.y += GRAVITY;

      // Update position
      mousePos.current.x += velocity.current.x;
      mousePos.current.y += velocity.current.y;

      // Check platform collisions
      isOnGround.current = false;
      platforms.forEach(platform => {
        if (
          mousePos.current.x + MOUSE_SIZE > platform.x &&
          mousePos.current.x < platform.x + platform.width &&
          mousePos.current.y + MOUSE_SIZE > platform.y &&
          mousePos.current.y + MOUSE_SIZE < platform.y + platform.height + 10 &&
          velocity.current.y > 0
        ) {
          mousePos.current.y = platform.y - MOUSE_SIZE;
          velocity.current.y = 0;
          isOnGround.current = true;
        }
      });

      // Boundary checks
      if (mousePos.current.x < 0) mousePos.current.x = 0;
      if (mousePos.current.x > MAP_WIDTH - MOUSE_SIZE) mousePos.current.x = MAP_WIDTH - MOUSE_SIZE;
      
      // Check death (falling into hole)
      if (mousePos.current.y > 650) {
        if (!isDead) {
          setIsDead(true);
          setDeathCount(prev => prev + 1);
          mousePos.current = { ...spawnPoint };
          velocity.current = { x: 0, y: 0 };
          cameraX.current = 0;
        }
      }

      // Fase 1: Check llegada al castillo
      if (phase === 'phase1' && mousePos.current.x >= castleDoorPos.x && mousePos.current.x <= castleDoorPos.x + 50) {
        setPhase('transition-close');
        setTransitionProgress(0);
        return;
      }

      // Fase 2: Check llegada al final (torre)
      if (phase === 'phase2' && mousePos.current.x >= phase2EndPos.x) {
        setPhase('transition2-close');
        setTransitionProgress(0);
        return;
      }

      // Update camera
      cameraX.current = Math.max(0, Math.min(mousePos.current.x - CANVAS_WIDTH / 2, MAP_WIDTH - CANVAS_WIDTH));

      // Clear and draw
      if (phase === 'phase1') {
        // Fase 1: Background Rosa San Valentín
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#FFB6D9');
        gradient.addColorStop(0.5, '#FFC8DD');
        gradient.addColorStop(1, '#FFAFCC');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else if (phase === 'phase2') {
        // Fase 2: Interior del castillo (oscuro)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // Save context for camera
      ctx.save();
      ctx.translate(-cameraX.current, 0);

      // Fase 2: Dibujar ambiente interior del castillo
      if (phase === 'phase2') {
        // Background 1: Paredes lejanas (parallax lento)
        const bgOffset1 = cameraX.current * 0.3;
        ctx.fillStyle = '#2a2a2a';
        for (let i = -1; i < 8; i++) {
          ctx.fillRect(i * 500 - bgOffset1 % 500, 0, 480, CANVAS_HEIGHT);
          ctx.fillStyle = '#353535';
          ctx.fillRect(i * 500 + 480 - bgOffset1 % 500, 0, 20, CANVAS_HEIGHT);
          ctx.fillStyle = '#2a2a2a';
        }
        
        // Background 2: Columnas (parallax medio) - MÁS ESPACIO
        const bgOffset2 = cameraX.current * 0.5;
        ctx.fillStyle = '#404040';
        for (let i = 0; i < 10; i++) {
          const colX = i * 600 - bgOffset2 % 600; // Cambiado de 350 a 600
          // Columna
          ctx.fillRect(colX, 0, 60, CANVAS_HEIGHT);
          // Detalles de la columna
          ctx.fillStyle = '#505050';
          ctx.fillRect(colX, 100, 60, 20);
          ctx.fillRect(colX, 250, 60, 20);
          ctx.fillRect(colX, 400, 60, 20);
          ctx.fillStyle = '#404040';
        }
        
        // Antorchas (parallax medio-rápido)
        const bgOffset3 = cameraX.current * 0.7;
        for (let i = 0; i < 20; i++) {
          const torchX = i * 250 + 100 - bgOffset3 % 250;
          const torchY = 150;
          
          // Soporte de antorcha
          ctx.fillStyle = '#2c1810';
          ctx.fillRect(torchX - 3, torchY, 6, 40);
          
          // Llama (animación simple)
          const flameOffset = Math.sin(Date.now() * 0.01 + i) * 3;
          ctx.fillStyle = '#ff6600';
          ctx.beginPath();
          ctx.arc(torchX, torchY + flameOffset, 12, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.arc(torchX, torchY + flameOffset, 7, 0, Math.PI * 2);
          ctx.fill();
          
          // Luz de antorcha
          const gradient = ctx.createRadialGradient(torchX, torchY, 0, torchX, torchY, 80);
          gradient.addColorStop(0, 'rgba(255, 150, 0, 0.3)');
          gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(torchX - 80, torchY - 80, 160, 160);
        }
        
        // Lámparas colgantes estilo vampiro
        for (let i = 0; i < 15; i++) {
          const lampX = i * 400 + 200 - cameraX.current;
          const lampY = 80;
          
          // Cadena
          ctx.strokeStyle = '#666';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(lampX, 0);
          ctx.lineTo(lampX, lampY);
          ctx.stroke();
          
          // Lámpara
          ctx.fillStyle = '#1a1a1a';
          ctx.beginPath();
          ctx.arc(lampX, lampY, 15, 0, Math.PI * 2);
          ctx.fill();
          
          // Luz de lámpara
          ctx.fillStyle = '#8B0000';
          ctx.beginPath();
          ctx.arc(lampX, lampY, 8, 0, Math.PI * 2);
          ctx.fill();
          
          // Resplandor rojo
          const lampGradient = ctx.createRadialGradient(lampX, lampY, 0, lampX, lampY, 60);
          lampGradient.addColorStop(0, 'rgba(139, 0, 0, 0.3)');
          lampGradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
          ctx.fillStyle = lampGradient;
          ctx.fillRect(lampX - 60, lampY - 60, 120, 120);
        }
      }

      // Draw decorations (solo fase 1)
      if (phase === 'phase1') {
        decorations.forEach(deco => {
        if (deco.type === 'flower') {
          // Flores
          ctx.fillStyle = '#FF69B4';
          ctx.beginPath();
          ctx.arc(deco.x, deco.y - 10, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FF1493';
          ctx.beginPath();
          ctx.arc(deco.x, deco.y - 10, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#228B22';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(deco.x, deco.y - 2);
          ctx.lineTo(deco.x, deco.y + 10);
          ctx.stroke();
        } else if (deco.type === 'heart') {
          // Corazones en el suelo
          ctx.fillStyle = '#FF1493';
          ctx.font = '30px Arial';
          ctx.fillText('💕', deco.x - 15, deco.y);
        }
      });
      }

      // Draw platforms
      platforms.forEach(platform => {
        if (platform.type === 'heart') {
          // Plataformas de corazón (rosas)
          ctx.fillStyle = '#FF69B4';
          ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
          ctx.strokeStyle = '#FF1493';
          ctx.lineWidth = 2;
          ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
          // Pequeños corazones en la plataforma
          ctx.fillStyle = '#FFC0CB';
          for (let i = 0; i < platform.width; i += 30) {
            ctx.font = '12px Arial';
            ctx.fillText('💗', platform.x + i, platform.y - 5);
          }
        } else if (platform.type === 'castle') {
          if (phase === 'phase2') {
            // Plataformas dentro del castillo (piedra oscura)
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            ctx.strokeStyle = '#2a2a2a';
            ctx.lineWidth = 2;
            ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            // Grietas en la piedra
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 1;
            for (let i = 0; i < platform.width; i += 40) {
              ctx.beginPath();
              ctx.moveTo(platform.x + i, platform.y);
              ctx.lineTo(platform.x + i + 20, platform.y + platform.height);
              ctx.stroke();
            }
          } else {
            // Base del castillo exterior
            ctx.fillStyle = '#D3D3D3';
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            ctx.strokeStyle = '#A9A9A9';
            ctx.lineWidth = 2;
            ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
          }
        } else {
          // Plataformas normales (madera)
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
          ctx.strokeStyle = '#654321';
          ctx.lineWidth = 2;
          ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        }
      });

      // Draw castle gótico
      if (phase === 'phase1') {
        // Torres góticas altas (gris oscuro)
        ctx.fillStyle = '#505050';
        ctx.fillRect(castlePos.x, castlePos.y, 80, 350);
        ctx.fillRect(castlePos.x + 170, castlePos.y, 80, 350);
        
        // Detalles oscuros en torres
        ctx.fillStyle = '#3A3A3A';
        ctx.fillRect(castlePos.x + 10, castlePos.y + 20, 60, 10);
        ctx.fillRect(castlePos.x + 10, castlePos.y + 60, 60, 10);
        ctx.fillRect(castlePos.x + 180, castlePos.y + 20, 60, 10);
        ctx.fillRect(castlePos.x + 180, castlePos.y + 60, 60, 10);
        
        // Cuerpo central gótico
        ctx.fillStyle = '#606060';
        ctx.fillRect(castlePos.x + 50, castlePos.y + 100, 150, 250);
        
        // Ventanas góticas (arcos puntiagudos)
        ctx.fillStyle = '#2C1810';
        // Torre izquierda
        ctx.fillRect(castlePos.x + 25, castlePos.y + 100, 30, 40);
        ctx.fillRect(castlePos.x + 25, castlePos.y + 180, 30, 40);
        // Torre derecha
        ctx.fillRect(castlePos.x + 195, castlePos.y + 100, 30, 40);
        ctx.fillRect(castlePos.x + 195, castlePos.y + 180, 30, 40);
        // Central
        ctx.fillRect(castlePos.x + 110, castlePos.y + 150, 30, 50);
        
        // Almenas góticas
        ctx.fillStyle = '#404040';
        for (let i = 0; i < 5; i++) {
          ctx.fillRect(castlePos.x + i * 16, castlePos.y - 15, 12, 20);
          ctx.fillRect(castlePos.x + 170 + i * 16, castlePos.y - 15, 12, 20);
        }
        
        // Techos puntiagudos góticos
        ctx.fillStyle = '#2A2A2A';
        ctx.beginPath();
        ctx.moveTo(castlePos.x - 10, castlePos.y);
        ctx.lineTo(castlePos.x + 40, castlePos.y - 50);
        ctx.lineTo(castlePos.x + 90, castlePos.y);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(castlePos.x + 160, castlePos.y);
        ctx.lineTo(castlePos.x + 210, castlePos.y - 50);
        ctx.lineTo(castlePos.x + 260, castlePos.y);
        ctx.fill();
        
        // Puerta con rejas levadiza (más oscura)
        ctx.fillStyle = '#2A2A2A';
        ctx.fillRect(castleDoorPos.x, castleDoorPos.y, 50, 70);
        
        // Marco de la puerta
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 4;
        ctx.strokeRect(castleDoorPos.x - 5, castleDoorPos.y - 5, 60, 80);
        
        // Rejas verticales (metal oscuro)
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(castleDoorPos.x + 5 + i * 10, castleDoorPos.y);
          ctx.lineTo(castleDoorPos.x + 5 + i * 10, castleDoorPos.y + 70);
          ctx.stroke();
        }
        
        // Rejas horizontales
        for (let i = 0; i < 7; i++) {
          ctx.beginPath();
          ctx.moveTo(castleDoorPos.x, castleDoorPos.y + i * 10);
          ctx.lineTo(castleDoorPos.x + 50, castleDoorPos.y + i * 10);
          ctx.stroke();
        }
        
        // Banderas con corazones en las torres
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(castlePos.x + 30, castlePos.y - 60, 5, 50);
        ctx.fillRect(castlePos.x + 200, castlePos.y - 60, 5, 50);
        ctx.font = '20px Arial';
        ctx.fillText('💖', castlePos.x + 15, castlePos.y - 65);
        ctx.fillText('💖', castlePos.x + 185, castlePos.y - 65);
      }

      // Draw mouse (color según fase)
      if (phase === 'phase1' || phase === 'phase2') {
        // Ratón marrón (fase 1 y 2)
        ctx.fillStyle = '#8B4513'; // Marrón
        ctx.beginPath();
        ctx.arc(mousePos.current.x + MOUSE_SIZE / 2, mousePos.current.y + MOUSE_SIZE / 2, MOUSE_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouse ears
        ctx.beginPath();
        ctx.arc(mousePos.current.x + 8, mousePos.current.y + 5, 8, 0, Math.PI * 2);
        ctx.arc(mousePos.current.x + MOUSE_SIZE - 8, mousePos.current.y + 5, 8, 0, Math.PI * 2);
        ctx.fill();

        // Mouse face
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(mousePos.current.x + 10, mousePos.current.y + 15, 2, 0, Math.PI * 2);
        ctx.arc(mousePos.current.x + 20, mousePos.current.y + 15, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Nariz
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(mousePos.current.x + 15, mousePos.current.y + 20, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      animationFrame.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [gameStarted, phase, isDead]);

  const handleTouchStart = (direction: 'left' | 'right' | 'jump') => {
    if (direction === 'left') {
      touchLeft.current = true;
    } else if (direction === 'right') {
      touchRight.current = true;
    } else if (direction === 'jump') {
      touchJump.current = true;
    }
  };

  const handleTouchEnd = (direction: 'left' | 'right' | 'jump') => {
    if (direction === 'left') {
      touchLeft.current = false;
    } else if (direction === 'right') {
      touchRight.current = false;
    } else if (direction === 'jump') {
      touchJump.current = false;
    }
  };

  // Death screen overlay
  if (isDead) {
    const deathMessage = deathCount <= 2 
      ? "Por ser tan hermosa tienes vidas infinitas" 
      : "Amor no te pases, si está fácil XD";
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
        {/* Canvas en background (borroso) */}
        <div className="absolute inset-0 blur-sm flex items-center justify-center">
          <div style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: '800/600' }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full h-full border-2 md:border-4 border-pink-500 rounded-lg shadow-2xl"
            />
          </div>
        </div>
        
        {/* Death overlay */}
        <div className="relative bg-black bg-opacity-70 p-6 md:p-8 rounded-2xl text-center max-w-md shadow-2xl border-4 border-pink-500">
          <div className="text-4xl md:text-6xl mb-3 md:mb-4">💔</div>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4">Woops</h2>
          <p className="text-base md:text-xl text-pink-200 mb-4 md:mb-6 font-semibold">{deathMessage}</p>
          <button
            onClick={() => {
              setIsDead(false);
            }}
            className="bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white font-bold py-3 px-6 md:py-4 md:px-8 rounded-full text-lg md:text-xl transition-all transform active:scale-95 shadow-lg"
            style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
          >
            Revivir 💖
          </button>
        </div>
      </div>
    );
  }

  // Cinemática de la torre
  if (phase === 'cinematic') {
    const progress = cinematicProgress;
    
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-2">
        <div style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: '800/600' }}>
          <canvas
            ref={(canvas) => {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            // Background oscuro
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            // Cámara que sube por la torre
            const cameraY = 2000 - (progress / 100) * 2000; // Sube desde 2000 hasta 0
            
            ctx.save();
            ctx.translate(0, -cameraY);
            
            // Torre (estructura vertical)
            const towerX = CANVAS_WIDTH / 2 - 150;
            const towerWidth = 300;
            const towerHeight = 2500;
            
            // Piedra de la torre
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(towerX, 0, towerWidth, towerHeight);
            
            // Detalles de piedra
            ctx.strokeStyle = '#2a2a2a';
            ctx.lineWidth = 3;
            for (let y = 0; y < towerHeight; y += 100) {
              ctx.strokeRect(towerX, y, towerWidth, 100);
            }
            
            // Ventanas de la torre
            ctx.fillStyle = '#1a1a1a';
            for (let y = 200; y < towerHeight; y += 300) {
              ctx.fillRect(towerX + 50, y, 80, 100);
              ctx.fillRect(towerX + 170, y, 80, 100);
              
              // Marco de ventanas
              ctx.strokeStyle = '#4a4a4a';
              ctx.lineWidth = 4;
              ctx.strokeRect(towerX + 50, y, 80, 100);
              ctx.strokeRect(towerX + 170, y, 80, 100);
            }
            
            // Dragón resguardando (aparece en progreso 40-60%)
            if (progress >= 40 && progress <= 60) {
              const dragonY = 1200;
              const dragonX = towerX + towerWidth + 80;
              
              // Cuerpo del dragón
              ctx.fillStyle = '#8B0000';
              ctx.beginPath();
              ctx.ellipse(dragonX, dragonY, 80, 60, 0, 0, Math.PI * 2);
              ctx.fill();
              
              // Cabeza
              ctx.beginPath();
              ctx.ellipse(dragonX + 70, dragonY - 20, 50, 40, 0, 0, Math.PI * 2);
              ctx.fill();
              
              // Cuernos
              ctx.fillStyle = '#4a0000';
              ctx.beginPath();
              ctx.moveTo(dragonX + 60, dragonY - 50);
              ctx.lineTo(dragonX + 50, dragonY - 80);
              ctx.lineTo(dragonX + 70, dragonY - 50);
              ctx.fill();
              
              ctx.beginPath();
              ctx.moveTo(dragonX + 80, dragonY - 50);
              ctx.lineTo(dragonX + 90, dragonY - 80);
              ctx.lineTo(dragonX + 100, dragonY - 50);
              ctx.fill();
              
              // Alas
              ctx.fillStyle = '#6a0000';
              ctx.beginPath();
              ctx.moveTo(dragonX - 20, dragonY);
              ctx.lineTo(dragonX - 100, dragonY - 80);
              ctx.lineTo(dragonX - 40, dragonY + 20);
              ctx.fill();
              
              ctx.beginPath();
              ctx.moveTo(dragonX - 20, dragonY + 40);
              ctx.lineTo(dragonX - 100, dragonY + 120);
              ctx.lineTo(dragonX - 40, dragonY + 60);
              ctx.fill();
              
              // Ojos
              ctx.fillStyle = '#FFD700';
              ctx.beginPath();
              ctx.arc(dragonX + 85, dragonY - 25, 8, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#000';
              ctx.beginPath();
              ctx.arc(dragonX + 87, dragonY - 25, 4, 0, Math.PI * 2);
              ctx.fill();
              
              // Fuego
              ctx.fillStyle = '#FF6600';
              ctx.font = '30px Arial';
              ctx.fillText('🔥', dragonX + 120, dragonY);
              ctx.fillText('🔥', dragonX + 140, dragonY - 10);
              ctx.fillText('🔥', dragonX + 130, dragonY + 10);
            }
            
            // Habitación de la princesa en la cima (se ve cuando progress > 80%)
            if (progress > 80) {
              const roomY = 100;
              
              // Techo cónico
              ctx.fillStyle = '#2a2a2a';
              ctx.beginPath();
              ctx.moveTo(towerX - 50, roomY);
              ctx.lineTo(towerX + towerWidth / 2, roomY - 150);
              ctx.lineTo(towerX + towerWidth + 50, roomY);
              ctx.fill();
              
              // Ventana de la habitación
              ctx.fillStyle = '#FFD700';
              ctx.fillRect(towerX + towerWidth / 2 - 40, roomY - 50, 80, 60);
              ctx.strokeStyle = '#2a2a2a';
              ctx.lineWidth = 4;
              ctx.strokeRect(towerX + towerWidth / 2 - 40, roomY - 50, 80, 60);
              
              // Ratoncita Diana en la ventana (si progress > 85%)
              if (progress > 85) {
                const dianaX = towerX + towerWidth / 2;
                const dianaY = roomY - 20;
                
                // Cuerpo blanco rosado
                ctx.fillStyle = '#FFE4E1';
                ctx.beginPath();
                ctx.arc(dianaX, dianaY, 20, 0, Math.PI * 2);
                ctx.fill();
                
                // Orejas rosadas
                ctx.fillStyle = '#FFB6D9';
                ctx.beginPath();
                ctx.arc(dianaX - 10, dianaY - 15, 8, 0, Math.PI * 2);
                ctx.arc(dianaX + 10, dianaY - 15, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Corona
                ctx.fillStyle = '#FFD700';
                ctx.font = '20px Arial';
                ctx.fillText('👑', dianaX - 10, dianaY - 25);
                
                // Burbuja de pensamiento
                if (progress > 90) {
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                  ctx.beginPath();
                  ctx.ellipse(dianaX - 100, dianaY - 80, 90, 50, 0, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.strokeStyle = '#000';
                  ctx.lineWidth = 2;
                  ctx.stroke();
                  
                  // Burbujas pequeñas
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                  ctx.beginPath();
                  ctx.arc(dianaX - 40, dianaY - 40, 8, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.stroke();
                  
                  ctx.beginPath();
                  ctx.arc(dianaX - 50, dianaY - 50, 5, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.stroke();
                  
                  // Texto en la burbuja
                  ctx.fillStyle = '#000';
                  ctx.font = '12px Arial';
                  ctx.fillText('Que aburrido,', dianaX - 150, dianaY - 90);
                  ctx.fillText('ojalá tuviera', dianaX - 150, dianaY - 75);
                  ctx.fillText('quesito tefemero', dianaX - 160, dianaY - 60);
                }
              }
            }
            
            ctx.restore();
            
            // Progress bar
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(0, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 10);
            ctx.fillStyle = '#FFB6D9';
            ctx.fillRect(0, CANVAS_HEIGHT - 10, (progress / 100) * CANVAS_WIDTH, 10);
          }}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full border-2 md:border-4 border-purple-800 rounded-lg shadow-2xl"
        />
        </div>
      </div>
    );
  }

  // Zoom in animation
  if (phase === 'zoom-in') {
    const progress = zoomProgress;
    const scale = 1 + (progress / 100) * 2; // De escala 1 a 3
    
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-2 overflow-hidden">
        <div style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: '800/600', transform: `scale(${scale})`, transition: 'transform 0.1s ease-out' }}>
          <canvas
            ref={(canvas) => {
              if (!canvas) return;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              
              // Dibujar habitación
              const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
              gradient.addColorStop(0, '#4a4a6a');
              gradient.addColorStop(1, '#2a2a3a');
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
              
              // Paredes de piedra
              ctx.fillStyle = '#505060';
              ctx.fillRect(0, 0, 50, CANVAS_HEIGHT);
              ctx.fillRect(CANVAS_WIDTH - 50, 0, 50, CANVAS_HEIGHT);
              
              // Suelo de piedra
              ctx.fillStyle = '#3a3a4a';
              ctx.fillRect(0, 500, CANVAS_WIDTH, 100);
              
              // Ventana
              ctx.fillStyle = '#87CEEB';
              ctx.fillRect(100, 150, 100, 120);
              ctx.strokeStyle = '#2a2a2a';
              ctx.lineWidth = 8;
              ctx.strokeRect(100, 150, 100, 120);
              ctx.beginPath();
              ctx.moveTo(150, 150);
              ctx.lineTo(150, 270);
              ctx.moveTo(100, 210);
              ctx.lineTo(200, 210);
              ctx.stroke();
              
              // Cuadro
              ctx.fillStyle = '#8B4513';
              ctx.fillRect(550, 180, 120, 100);
              ctx.fillStyle = '#FFB6D9';
              ctx.fillRect(560, 190, 100, 80);
              ctx.font = '40px Arial';
              ctx.fillText('💖', 580, 240);
              
              // Cama
              ctx.fillStyle = '#4a2a1a';
              ctx.fillRect(550, 420, 200, 80);
              ctx.fillStyle = '#FF69B4';
              ctx.fillRect(550, 400, 200, 40);
              ctx.strokeStyle = '#FF1493';
              ctx.lineWidth = 2;
              ctx.strokeRect(550, 400, 200, 40);
              ctx.fillStyle = '#FFB6D9';
              ctx.fillRect(560, 390, 50, 20);
              
              // Princesa Diana
              const dianaX = 650;
              const dianaY = 380;
              ctx.fillStyle = '#FFE4E1';
              ctx.beginPath();
              ctx.arc(dianaX, dianaY, 25, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#FFB6D9';
              ctx.beginPath();
              ctx.arc(dianaX - 12, dianaY - 18, 10, 0, Math.PI * 2);
              ctx.arc(dianaX + 12, dianaY - 18, 10, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#FFD700';
              ctx.font = '20px Arial';
              ctx.fillText('👑', dianaX - 12, dianaY - 30);
            }}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full border-2 md:border-4 border-purple-800 rounded-lg shadow-2xl"
          />
        </div>
      </div>
    );
  }

  // Diálogo/Cutscene interactivo
  if (phase === 'dialogue') {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-2" style={{
        background: 'linear-gradient(to bottom, #4a4a6a, #2a2a3a)'
      }}>
        <div className="relative" style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: '800/600' }}>
          {/* Habitación de fondo */}
          <canvas
            ref={(canvas) => {
              if (!canvas) return;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              
              // Fondo
              const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
              gradient.addColorStop(0, '#4a4a6a');
              gradient.addColorStop(1, '#2a2a3a');
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
              
              // Paredes
              ctx.fillStyle = '#505060';
              ctx.fillRect(0, 0, 50, CANVAS_HEIGHT);
              ctx.fillRect(CANVAS_WIDTH - 50, 0, 50, CANVAS_HEIGHT);
              
              // Suelo
              ctx.fillStyle = '#3a3a4a';
              ctx.fillRect(0, 500, CANVAS_WIDTH, 100);
              
              // Ventana con mensaje inicial
              ctx.fillStyle = '#87CEEB';
              ctx.fillRect(100, 150, 100, 120);
              ctx.strokeStyle = '#2a2a2a';
              ctx.lineWidth = 8;
              ctx.strokeRect(100, 150, 100, 120);
              
              if (dialogueStep === 0) {
                // Mensaje "DIANAAAAAAAAAAA" en la ventana
                ctx.fillStyle = '#FF1493';
                ctx.font = 'bold 24px Arial';
                ctx.save();
                ctx.translate(150, 210);
                ctx.rotate(-Math.PI / 2);
                ctx.fillText('DIANAAAAAAAAAAA', -80, 0);
                ctx.restore();
              }
              
              // Cuadro
              ctx.fillStyle = '#8B4513';
              ctx.fillRect(550, 180, 120, 100);
              ctx.fillStyle = '#FFB6D9';
              ctx.fillRect(560, 190, 100, 80);
              ctx.font = '40px Arial';
              ctx.fillText('💖', 580, 240);
              
              // Cama
              ctx.fillStyle = '#4a2a1a';
              ctx.fillRect(550, 420, 200, 80);
              ctx.fillStyle = '#FF69B4';
              ctx.fillRect(550, 400, 200, 40);
              ctx.strokeStyle = '#FF1493';
              ctx.lineWidth = 2;
              ctx.strokeRect(550, 400, 200, 40);
              ctx.fillStyle = '#FFB6D9';
              ctx.fillRect(560, 390, 50, 20);
              
              // Princesa Diana
              const dianaX = 400;
              const dianaY = showExclamation ? 430 : 450; // Salto cuando hay exclamación
              ctx.fillStyle = '#FFE4E1';
              ctx.beginPath();
              ctx.arc(dianaX, dianaY, 30, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#FFB6D9';
              ctx.beginPath();
              ctx.arc(dianaX - 15, dianaY - 22, 12, 0, Math.PI * 2);
              ctx.arc(dianaX + 15, dianaY - 22, 12, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#000';
              ctx.beginPath();
              ctx.arc(dianaX - 10, dianaY - 10, 3, 0, Math.PI * 2);
              ctx.arc(dianaX + 10, dianaY - 10, 3, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#FFD700';
              ctx.font = '24px Arial';
              ctx.fillText('👑', dianaX - 15, dianaY - 35);
              
              if (showExclamation) {
                ctx.fillStyle = '#FF0000';
                ctx.font = 'bold 40px Arial';
                ctx.fillText('!', dianaX + 35, dianaY - 30);
              }
              
              // Ratón macho si ya entró
              if (boyMouseInRoom) {
                const boyX = 250;
                const boyY = 450;
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.arc(boyX, boyY, 30, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(boyX - 15, boyY - 22, 12, 0, Math.PI * 2);
                ctx.arc(boyX + 15, boyY - 22, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(boyX - 10, boyY - 10, 3, 0, Math.PI * 2);
                ctx.arc(boyX + 10, boyY - 10, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Vendas/lastimado
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(boyX - 20, boyY - 5);
                ctx.lineTo(boyX + 20, boyY - 5);
                ctx.stroke();
              }
            }}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full border-2 md:border-4 border-purple-800 rounded-lg shadow-2xl"
          />
          
          {/* Diálogos */}
          {dialogueStep >= 3 && (
            <div className="absolute bottom-2 left-2 right-2 max-h-[40vh] overflow-y-auto" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
              {dialogueStep === 3 && (
                <div className="bg-black bg-opacity-90 p-3 rounded-lg">
                  <p className="text-white text-sm md:text-lg mb-3">
                    <span className="font-bold text-amber-600">🐭 jeff:</span> "dios santo, estoy muerto? o por q tengo a un angel frente a mis ojos?"
                  </p>
                  <button
                    onClick={() => setDialogueStep(4)}
                    className="bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white px-4 py-2 rounded-full text-sm md:text-base font-semibold"
                    style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
                  >
                    Continuar
                  </button>
                </div>
              )}
              
              {dialogueStep === 4 && (
                <div className="bg-black bg-opacity-90 p-3 rounded-lg">
                  <p className="text-white text-sm md:text-lg mb-3">
                    <span className="font-bold text-pink-400">👑 Diana:</span> "ola wapo, q te paso"
                  </p>
                  <button
                    onClick={() => setDialogueStep(5)}
                    className="bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white px-4 py-2 rounded-full text-sm md:text-base font-semibold"
                    style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
                  >
                    Continuar
                  </button>
                </div>
              )}
              
              {dialogueStep === 5 && (
                <div className="bg-black bg-opacity-90 p-3 rounded-lg">
                  <p className="text-white text-sm md:text-lg mb-3">
                    <span className="font-bold text-amber-600">🐭 jeff:</span> "no nada, solo q estabas resguardada por un dragon q casi me come, pero me lo comi yo, con su propio fuego hice parrilla, quieres?"
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDialogueStep(6)}
                      className="bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white px-4 py-2 rounded-full font-bold text-sm md:text-base"
                      style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
                    >
                      sii
                    </button>
                    <button
                      onClick={() => setDialogueStep(6)}
                      className="bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white px-4 py-2 rounded-full font-bold text-sm md:text-base"
                      style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
                    >
                      nativas?
                    </button>
                  </div>
                </div>
              )}
              
              {dialogueStep === 6 && (
                <div className="bg-black bg-opacity-90 p-3 rounded-lg">
                  <p className="text-white text-sm md:text-lg mb-3">
                    <span className="font-bold text-amber-600">🐭 jeff:</span> "YA GOO, pero mira te traje algo"
                  </p>
                  <button
                    onClick={() => setDialogueStep(7)}
                    className="bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white px-6 py-2 rounded-full font-bold text-base md:text-xl"
                    style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
                  >
                    🎁 Abrir
                  </button>
                </div>
              )}
              
              {dialogueStep === 7 && (
                <div className="relative bg-gradient-to-br from-amber-50 to-yellow-50 p-4 md:p-8 rounded-lg border-4 md:border-8 shadow-2xl text-center max-h-[85vh] overflow-y-auto" style={{
                  borderImage: 'repeating-linear-gradient(45deg, #8B4513, #8B4513 10px, #D2691E 10px, #D2691E 20px) 8',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.3), inset 0 0 20px rgba(139,69,19,0.1)',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}>
                  {/* Decoraciones de esquina vintage */}
                  <div className="absolute top-1 left-1 md:top-4 md:left-4 text-xl md:text-4xl text-amber-700">❦</div>
                  <div className="absolute top-1 right-1 md:top-4 md:right-4 text-xl md:text-4xl text-amber-700">❦</div>
                  <div className="absolute bottom-1 left-1 md:bottom-4 md:left-4 text-xl md:text-4xl text-amber-700">❦</div>
                  <div className="absolute bottom-1 right-1 md:bottom-4 md:right-4 text-xl md:text-4xl text-amber-700">❦</div>
                  
                  {/* Contenido de la carta */}
                  <div className="relative z-10">
                    <div className="border-t-2 border-b-2 border-amber-800 py-1 mb-3 md:py-2 md:mb-6">
                      <h2 className="text-sm md:text-2xl font-serif text-amber-900 tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
                        ❦ SAN VALENTIN'S LETTER ❦
                      </h2>
                    </div>
                    
                    <div className="my-4 md:my-8">
                      <p className="text-lg md:text-3xl text-amber-900 mb-4 md:mb-8 leading-relaxed" style={{ 
                        fontFamily: 'Georgia, serif',
                        fontStyle: 'italic',
                        textShadow: '1px 1px 2px rgba(139,69,19,0.2)'
                      }}>
                        ¿Me darías el gran honor<br />de ser tu San Valentín?
                      </p>
                      
                      <div className="flex items-center justify-center gap-2 mb-3 md:mb-6">
                        <div className="h-px w-8 md:w-16 bg-amber-600"></div>
                        <span className="text-lg md:text-2xl">🧀</span>
                        <div className="h-px w-8 md:w-16 bg-amber-600"></div>
                      </div>
                      
                      <p className="text-base md:text-xl text-amber-800 mb-1 md:mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                        tengo quesito
                      </p>
                      <p className="text-sm md:text-lg text-amber-700 italic mb-4 md:mb-8">y nativas en la noche uwu</p>
                    </div>
                    
                    <div className="flex gap-3 md:gap-6 justify-center mt-4 md:mt-8">
                      <button
                        onClick={() => setDialogueStep(8)}
                        className="bg-amber-800 hover:bg-amber-900 active:bg-amber-950 text-amber-50 px-6 md:px-14 py-3 md:py-5 rounded border-2 md:border-4 border-amber-950 font-bold text-base md:text-2xl transform active:scale-95 transition-all shadow-lg"
                        style={{ fontFamily: 'Georgia, serif', userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setDialogueStep(8)}
                        className="bg-amber-900 hover:bg-amber-950 active:bg-black text-amber-50 px-6 md:px-14 py-3 md:py-5 rounded border-2 md:border-4 border-amber-950 font-bold text-base md:text-2xl transform active:scale-95 transition-all shadow-lg"
                        style={{ fontFamily: 'Georgia, serif', userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation' }}
                      >
                        ¡SÍ!
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {dialogueStep === 8 && (
                <div className="bg-gradient-to-br from-pink-300 to-purple-300 p-6 md:p-12 rounded-lg text-center">
                  <h1 className="text-3xl md:text-6xl font-bold text-white mb-4 md:mb-6 animate-bounce">¡Nos vemos el 14 en nativas! 💖</h1>
                  <p className="text-lg md:text-3xl text-white mb-2 md:mb-4">Te amo mucho mi ratatuina come quesito</p>
                  <div className="text-4xl md:text-8xl">🐭💖🐭🧀</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Transition screen
  if (phase === 'transition-close' || phase === 'transition-open' || phase === 'transition2-close' || phase === 'transition2-open') {
    const radius = ((100 - transitionProgress) / 100) * Math.max(CANVAS_WIDTH, CANVAS_HEIGHT) * 1.5;
    
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-2">
        <div style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: '800/600' }}>
          <svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-full">
          <defs>
            <mask id="circleMask">
              <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="black" />
              <circle
                cx={CANVAS_WIDTH / 2}
                cy={CANVAS_HEIGHT / 2}
                r={radius}
                fill="white"
              />
            </mask>
          </defs>
          <rect
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill="#FFB6D9"
            mask="url(#circleMask)"
          />
        </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-purple-900 flex items-center justify-center p-2">
      <div className="relative" style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: '800/600' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full border-2 md:border-4 border-pink-500 rounded-lg shadow-2xl"
        />
        
        {/* Mobile touch controls */}
        <div className="fixed bottom-4 left-0 right-0 flex justify-between px-4 md:hidden z-50" style={{ userSelect: 'none', touchAction: 'manipulation' }}>
          <div className="flex gap-3">
            <button
              onTouchStart={(e) => { e.preventDefault(); handleTouchStart('left'); }}
              onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd('left'); }}
              className="bg-pink-500 bg-opacity-80 text-white font-bold w-20 h-20 rounded-full active:bg-pink-600 text-3xl shadow-lg border-2 border-pink-300"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <span style={{ pointerEvents: 'none' }}>←</span>
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); handleTouchStart('right'); }}
              onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd('right'); }}
              className="bg-pink-500 bg-opacity-80 text-white font-bold w-20 h-20 rounded-full active:bg-pink-600 text-3xl shadow-lg border-2 border-pink-300"
              style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            >
              <span style={{ pointerEvents: 'none' }}>→</span>
            </button>
          </div>
          <button
            onTouchStart={(e) => { e.preventDefault(); handleTouchStart('jump'); }}
            onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd('jump'); }}
            className="bg-pink-600 bg-opacity-80 text-white font-bold w-20 h-20 rounded-full active:bg-pink-700 text-3xl shadow-lg border-2 border-pink-300"
            style={{ userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <span style={{ pointerEvents: 'none' }}>↑</span>
          </button>
        </div>

        {/* Status indicator */}
        <div className="absolute top-2 right-2 bg-pink-500 bg-opacity-90 text-white px-2 py-1 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-base" style={{ userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none' }}>
          {phase === 'phase1' ? '🐭 Dirígete al castillo 🏰' : '🏰 Dentro del castillo'}
        </div>
      </div>
    </div>
  );
}
