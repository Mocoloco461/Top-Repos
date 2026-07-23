'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Lists',
      href: '/lists',
      icon: Home,
      isActive: pathname.startsWith('/lists'),
    },
    {
      name: 'Explore',
      href: '/',
      icon: Compass,
      isActive: pathname === '/' || pathname.startsWith('/repo/'),
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      isActive: pathname.startsWith('/settings'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d1117]/95 backdrop-blur border-t border-[#30363d] pb-safe">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center space-y-1 text-xs transition-colors px-3 py-1 ${
                active ? 'text-[#58a6ff]' : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
