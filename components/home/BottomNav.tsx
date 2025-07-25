'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Home, Target, ShoppingCart, Settings } from 'lucide-react';
import { TouchLink } from '@/components/ui/TouchLink';

export function BottomNav() {
  const pathname = usePathname();
  
  const navItems = [
    { 
      href: '/', 
      icon: Home, 
      label: 'Home'
    },
    { 
      href: '/discover', 
      icon: Target, 
      label: 'Discover'
    },
    { 
      href: '/shop', 
      icon: ShoppingCart, 
      label: 'Shop'
    },
    { 
      href: '/settings', 
      icon: Settings, 
      label: 'Settings'
    }
  ];

  return (
    <nav className="bg-white flex items-center justify-around w-full" style={{ 
      padding: 'min(3vw, 0.75rem) 0', 
      paddingBottom: 'calc(min(3vw, 0.75rem) + env(safe-area-inset-bottom, 0))',
      minHeight: 'calc(min(15vw, 3.75rem) + env(safe-area-inset-bottom, 0))', 
      maxHeight: 'calc(min(20vw, 5rem) + env(safe-area-inset-bottom, 0))', 
      borderTop: 'min(0.25vw, 1px) solid #e5e7eb' 
    }}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href === '/' && pathname === '/');
        const Icon = item.icon;
        
        return (
          <TouchLink
            key={item.href}
            href={item.href}
            variant="subtle"
            haptic="light"
            scale={0.95}
            className="flex flex-col items-center justify-center flex-1"
            style={{ gap: '1vw' }}
          >
            <Icon 
              className={isActive ? '' : 'text-gray-500'}
              style={{ 
                width: 'min(6vw, 1.5rem)', 
                height: 'min(6vw, 1.5rem)',
                color: isActive ? '#db2777' : undefined
              }} 
              strokeWidth={2}
              fill={isActive && item.icon === Home ? 'currentColor' : 'none'}
            />
            <span 
              className={isActive ? 'font-medium' : 'text-gray-500'}
              style={{ 
                fontSize: 'min(3vw, 0.75rem)',
                color: isActive ? '#db2777' : undefined
              }}
            >
              {item.label}
            </span>
          </TouchLink>
        );
      })}
    </nav>
  );
}