'use client';

import {useAuth} from '@/lib/auth/AuthProvider';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {
  Sparkles,
  Plus,
  Library,
  Users,
  Settings,
  CreditCard,
  LogOut,
  User,
  CheckCircle,
  XCircle,
  ArrowRight,
  Zap,
  BookOpen,
  Share2,
  FolderOpen,
} from 'lucide-react';
import {debugAuthState} from '@/lib/auth/auth-utils';

export default function DashboardPage() {
  const {user, signOut} = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // Clear client-side session
      await signOut();
      // Clear server-side cookies/session
      await fetch('/auth/sign-out', {method: 'POST', cache: 'no-store'});
    } catch { }
    // Hard redirect to ensure middleware reads fresh cookie state
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    } else {
      router.replace('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <Badge variant="gradient" className="mb-6">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Prompt Builder
              </Badge>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Welcome back, {user?.email?.split('@')[0]}!
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                Ready to create amazing AI prompts? Let&apos;s get started with your dashboard.
              </p>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* User Profile Card */}
              <Card variant="elevated" className="backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Your Profile</CardTitle>
                  <CardDescription>
                    Account information and status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{user?.email}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</span>
                      <div className="flex items-center gap-2">
                        {user?.email_confirmed_at ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600 dark:text-green-400">Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-amber-500" />
                            <span className="text-sm text-amber-600 dark:text-amber-400">Pending</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">User ID</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">{user?.id?.slice(0, 8)}...</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card variant="elevated" className="backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Quick Actions</CardTitle>
                  <CardDescription>
                    Get started with prompt building
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => router.push('/dashboard/builder')}
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Prompt
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    onClick={() => router.push('/dashboard/library')}
                    className="w-full h-11 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:shadow-md"
                  >
                    <Library className="w-4 h-4 mr-2" />
                    View My Library
                  </Button>
                  <Button className="w-full h-11 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:shadow-md">
                    <Users className="w-4 h-4 mr-2" />
                    Explore Community
                  </Button>
                </CardContent>
              </Card>

              {/* Account Management Card */}
              <Card variant="elevated" className="backdrop-blur-sm border-0 shadow-xl">
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Account</CardTitle>
                  <CardDescription>
                    Manage your account settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full h-11 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:shadow-md">
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </Button>
                  <Button className="w-full h-11 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:shadow-md">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Subscription
                  </Button>
                  <Button
                    onClick={handleSignOut}
                    className="w-full h-11 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-all duration-200 hover:shadow-md"
                    variant="outline"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Getting Started Section */}
            <Card variant="elevated" className="backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="text-center pb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl">Getting Started</CardTitle>
                <CardDescription className="text-lg">
                  Here&apos;s what you can do with AI Prompt Builder
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div
                    onClick={() => router.push('/dashboard/builder')}
                    className="group p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-lg cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          Create Prompts
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          Build and save AI prompts with variables and templates for consistent results across all your AI interactions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                          AI Improvement
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          Use AI to improve your prompts and get better results from language models with intelligent suggestions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Share2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          Community
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          Share and discover prompts from the community, rate and comment on others&apos; work to build better prompts together.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => router.push('/dashboard/library')}
                    className="group p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:shadow-lg cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FolderOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          Library Management
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          Organize your prompts with categories, tags, and search functionality to keep everything organized and accessible.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
