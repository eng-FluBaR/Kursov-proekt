'use client';

import Link from 'next/link';
import React from 'react';

interface SidebarProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/', label: 'Landing' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/log', label: 'Log Entry' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/projects', label: 'Projects' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/admin', label: 'Admin' },
  { href: '/settings', label: 'Settings' },
];

const tabItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/log', label: 'Log' },
  { href: '/projects', label: 'Projects' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/settings', label: 'Settings' },
];

export function Sidebar({ children }: SidebarProps) {
  return <div className="flex">{children}</div>;
}

export function SidebarNav() {
  return (
    <nav className="hidden md:flex md:flex-col w-64 bg-gray-900 text-white p-6 space-y-6 min-h-screen">
      <div className="text-2xl font-bold">TaskTimer</div>
      <div className="space-y-4">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="block px-4 py-2 rounded hover:bg-gray-800">
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function BottomTabNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 text-white flex justify-around py-2 border-t border-gray-800">
      {tabItems.map((item) => (
        <Link key={item.href} href={item.href} className="flex-1 text-center py-2 text-xs hover:bg-gray-800">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
