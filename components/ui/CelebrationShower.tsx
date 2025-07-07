'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Star, Heart } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  icon: 'sparkle' | 'star' | 'heart';
  delay: number;
  duration: number;
}

interface CelebrationShowerProps {
  onComplete?: () => void;
  duration?: number;
}

export const CelebrationShower: React.FC<CelebrationShowerProps> = ({ 
  onComplete, 
  duration = 3000 
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Generate random particles
    const newParticles: Particle[] = [];
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        icon: ['sparkle', 'star', 'heart'][Math.floor(Math.random() * 3)] as 'sparkle' | 'star' | 'heart',
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 1
      });
    }
    
    setParticles(newParticles);

    // Hide after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Congratulations Message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="text-center animate-bounce-in"
          style={{
            animation: 'bounceIn 0.6s ease-out'
          }}
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-rose to-burgundy bg-clip-text text-transparent mb-3">
            Congratulations! 🎉
          </h2>
          <p className="text-xl md:text-2xl text-gray-700">
            You completed your wellness routine!
          </p>
        </div>
      </div>

      {/* Falling Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-fall"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        >
          {particle.icon === 'sparkle' && (
            <Sparkles className="w-8 h-8 text-rose animate-spin-slow" />
          )}
          {particle.icon === 'star' && (
            <Star className="w-8 h-8 text-yellow-400 animate-pulse" />
          )}
          {particle.icon === 'heart' && (
            <Heart className="w-8 h-8 text-burgundy animate-pulse" />
          )}
        </div>
      ))}

      <style jsx>{`
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(120vh) rotate(360deg);
            opacity: 0;
          }
        }

        .animate-fall {
          animation: fall linear forwards;
        }

        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};