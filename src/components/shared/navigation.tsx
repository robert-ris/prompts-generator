'use client';

import React from 'react';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Sparkles, Menu, X, User, Settings, LogOut} from 'lucide-react';
import {useAuth} from '@/lib/auth/AuthProvider';
import Link from 'next/link';

interface NavigationProps {
  className?: string;
}

export function Navigation({className}: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const {user, signOut} = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 glass border-b border-border/20 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </Link>
            <Link href="/">
              <span className="text-xl font-bold gradient-text">PromptBuilder</span>
            </Link>
            <Badge variant="success" size="sm">Beta</Badge>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-foreground/80 hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-foreground/80 hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#docs" className="text-foreground/80 hover:text-foreground transition-colors">
              Docs
            </a>
            <a href="#community" className="text-foreground/80 hover:text-foreground transition-colors">
              Community
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="gradient" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/20">
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-foreground/80 hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-foreground/80 hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#docs" className="text-foreground/80 hover:text-foreground transition-colors">
                Docs
              </a>
              <a href="#community" className="text-foreground/80 hover:text-foreground transition-colors">
                Community
              </a>
              <div className="pt-4 border-t border-border/20">
                {user ? (
                  <>
                    <Link href="/dashboard">
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="w-4 h-4 mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full mt-2 justify-start" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login">
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="w-4 h-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button variant="gradient" className="w-full mt-2">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
