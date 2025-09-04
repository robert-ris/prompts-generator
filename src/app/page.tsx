'use client';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {Navigation} from '@/components/shared/navigation';
import {Footer} from '@/components/shared/footer';
import {Sparkles, Zap, Library, Users, ArrowRight, Star} from 'lucide-react';
import {useAuth} from '@/lib/auth/AuthProvider';
import Link from 'next/link';
import {useRouter} from 'next/navigation';

export default function Home() {
  const {user} = useAuth();
  const router = useRouter();

  console.log('process.env.NEXT_PUBLIC_APP_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Navigation />

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative container mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <Badge variant="gradient" className="mb-6">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Prompt Builder
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Create
              <span className="gradient-text"> Intelligent</span>
              <br />
              AI Prompts
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8">
              Build, optimize, and manage AI prompts with intelligent assistance.
              Get real-time suggestions and create prompts that deliver better results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Link href="/dashboard">
                  <Button size="xl" variant="gradient" className="group">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signup">
                  <Button size="xl" variant="gradient" className="group">
                    Get Started Free
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="xl">
                <Star className="w-4 h-4 mr-2" />
                View Examples
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16" id="features">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Everything you need to build better prompts
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            From simple templates to advanced AI-powered optimization
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <Card variant="elevated" className="group hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl">Dynamic Prompt Builder</CardTitle>
              <CardDescription>
                Create prompts with real-time preview and intelligent template variables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  variant="glass"
                  placeholder="Enter your prompt template..."
                  className="font-mono text-sm"
                />
                <Button
                  variant="gradient"
                  className="w-full group"
                  onClick={() => router.push('/dashboard/builder')}
                >
                  Start Building
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="group hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl">AI-Powered Improvements</CardTitle>
              <CardDescription>
                Get intelligent suggestions to enhance your prompts and improve results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="w-4 h-4 mr-2" />
                  Tighten Prompt
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Expand Prompt
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Star className="w-4 h-4 mr-2" />
                  Optimize for Results
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="group hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Library className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl">Personal Library</CardTitle>
              <CardDescription>
                Save, organize, and manage your prompt collection with smart categorization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  onClick={() => router.push('/dashboard/library')}
                >
                  <Library className="w-4 h-4 mr-2" />
                  View Library
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Import Prompts
                </Button>
                <div className="flex gap-2">
                  <Badge variant="success">Templates</Badge>
                  <Badge variant="info">Custom</Badge>
                  <Badge variant="warning">Drafts</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="my-16" />

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <Card variant="glass" className="max-w-2xl mx-auto p-8">
            <CardHeader>
              <CardTitle className="text-2xl mb-4">Ready to build better prompts?</CardTitle>
              <CardDescription className="text-base">
                Join thousands of developers and creators who are already using AI Prompt Builder
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link href="/dashboard">
                    <Button size="lg" variant="gradient" className="group">
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/signup">
                    <Button size="lg" variant="gradient" className="group">
                      Start Building Now
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                )}
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
