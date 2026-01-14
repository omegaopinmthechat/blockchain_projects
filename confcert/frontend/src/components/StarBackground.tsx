'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  driftSpeed: number;
  driftDirection: number;
  color: string;
  initialX: number;
  initialY: number;
}

interface StarBackgroundProps {
  starCount?: number;
  className?: string;
}

export default function StarBackground({
  starCount = 150,
  className = ''
}: StarBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isVisibleRef = useRef(true);

  // Adaptive star count based on device performance
  const getAdaptiveStarCount = useCallback(() => {
    if (typeof window === 'undefined') return starCount;

    const isMobile = window.innerWidth < 768;
    const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

    if (isMobile) return Math.min(starCount * 0.3, 50);
    if (isLowEnd) return Math.min(starCount * 0.6, 80);
    return starCount;
  }, [starCount]);

  // Create stars
  const createStars = useCallback(() => {
    if (typeof window === 'undefined') return;

    const adaptiveCount = getAdaptiveStarCount();
    const stars: Star[] = [];

    for (let i = 0; i < adaptiveCount; i++) {
      const size = Math.random() * 2 + 0.5; // 0.5-2.5px
      const isBlue = Math.random() < 0.3; // 30% blue stars

      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        initialX: 0,
        initialY: 0,
        size,
        opacity: Math.random() * 0.8 + 0.2, // 0.2-1.0
        twinkleSpeed: Math.random() * 3 + 2, // 2-5 seconds
        driftSpeed: Math.random() * 0.5 + 0.1, // Very slow drift
        driftDirection: Math.random() * Math.PI * 2,
        color: isBlue ? '#93c5fd' : '#ffffff'
      });
    }

    starsRef.current = stars;
  }, [getAdaptiveStarCount]);

  // Handle mouse movement for parallax
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    isVisibleRef.current = !document.hidden;
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    if (!canvasRef.current || !isVisibleRef.current) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw stars
    starsRef.current.forEach((star, index) => {
      // Very subtle parallax based on mouse position
      const parallaxX = (mouseRef.current.x - canvas.width / 2) * 0.0001;
      const parallaxY = (mouseRef.current.y - canvas.height / 2) * 0.0001;

      // Slow drift
      star.x += Math.cos(star.driftDirection) * star.driftSpeed;
      star.y += Math.sin(star.driftDirection) * star.driftSpeed;

      // Wrap around screen
      if (star.x < -10) star.x = canvas.width + 10;
      if (star.x > canvas.width + 10) star.x = -10;
      if (star.y < -10) star.y = canvas.height + 10;
      if (star.y > canvas.height + 10) star.y = -10;

      // Twinkle effect using sine wave
      const time = Date.now() * 0.001;
      const twinkle = Math.sin(time * star.twinkleSpeed + index) * 0.3 + 0.7;
      const currentOpacity = star.opacity * twinkle;

      // Draw star
      ctx.save();
      ctx.globalAlpha = currentOpacity;
      ctx.fillStyle = star.color;

      // Draw star shape (simple circle with slight glow)
      ctx.shadowColor = star.color;
      ctx.shadowBlur = star.size * 2;

      ctx.beginPath();
      ctx.arc(star.x + parallaxX, star.y + parallaxY, star.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    animationRef.current = requestAnimationFrame(animate);
  }, []);

  // Handle resize
  const handleResize = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;

    // Recreate stars on resize for better distribution
    createStars();
  }, [createStars]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set initial canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create stars
    createStars();

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [createStars, animate, handleResize, handleMouseMove, handleVisibilityChange]);

  return (
    <>
      {/* Nebula gradient background */}
      <div
        className={`fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 ${className}`}
        style={{
          background: `
            radial-gradient(ellipse at top, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at bottom, rgba(147, 197, 253, 0.1) 0%, transparent 50%),
            linear-gradient(to bottom, #0f172a 0%, #1e293b 50%, #0f172a 100%)
          `
        }}
      />

      {/* Stars canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{
          width: '100vw',
          height: '100vh',
          willChange: 'transform'
        }}
      />
    </>
  );
}