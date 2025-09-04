'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {
  Home,
  Plus,
  FolderOpen,
  Users,
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react';
import {useAuth} from '@/lib/auth/AuthProvider';

interface DashboardNavProps {
  className?: string;
}

export function DashboardNav({className}: DashboardNavProps) {
  const pathname = usePathname();
  const {signOut} = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: Home,
    },
    {
      href: '/dashboard/builder',
      label: 'Create Prompt',
      icon: Plus,
    },
    {
      href: '/dashboard/library',
      label: 'My Library',
      icon: FolderOpen,
    },
    {
      href: '/dashboard/community',
      label: 'Community',
      icon: Users,
    },
    {
      href: '/dashboard/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <nav className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </Link>
            <Link href="/dashboard">
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                PromptBuilder
              </span>
            </Link>
            <Badge variant="secondary" className="text-xs">Beta</Badge>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-2">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className="flex items-center gap-1 whitespace-nowrap"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
