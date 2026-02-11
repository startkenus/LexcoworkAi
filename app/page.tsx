'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Shield, Globe, FileCheck, Scale, Users, AlertTriangle, Lock, FileText, ClipboardCheck, SearchCheck, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-black/40 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image
                src="/lexcoworkailogo-removebg-preview.png"
                alt="LexCoworkAI Logo"
                width={180}
                height={60}
                className="h-12 w-auto"
              />
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">Sign In</Button>
              </Link>
              <a href="https://app.cal.com/event-types/2863209" target="_blank" rel="noopener noreferrer">
                <Button className="bg-white text-black hover:bg-gray-200">Book Demo</Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-800/20 to-transparent -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <h1 className="text-5xl md:text-6xl font-bold text-white">LexCoworkAI</h1>
            </div>
            <div className="flex justify-center gap-2 mb-6">
              <Badge variant="secondary" className="px-4 py-1 bg-gray-700/50 text-gray-100 border-gray-600">
                <Globe className="w-3 h-3 mr-1" />
                Built for India & USA
              </Badge>
              <Badge variant="secondary" className="px-4 py-1 bg-gray-700/50 text-gray-100 border-gray-600">
                <Shield className="w-3 h-3 mr-1" />
                Legal Safety
              </Badge>
              <Badge variant="secondary" className="px-4 py-1 bg-gray-700/50 text-gray-100 border-gray-600">
                <Users className="w-3 h-3 mr-1" />
                Human Governed
              </Badge>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Legal-Only, <span className="text-gray-300">Cowork-Class</span> AI Platform
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              LexCoworkAI helps founders, in-house teams, and legal professionals review contracts, draft policies, and run compliance checks—with jurisdiction-aware guardrails and human-approved actions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://app.cal.com/event-types/2863209" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="gap-2 w-full sm:w-auto bg-white text-black hover:bg-gray-200">
                  Request Early Access <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a href="https://app.cal.com/event-types/2863209" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-gray-500 text-white hover:bg-white/10">
                  Book a Demo
                </Button>
              </a>
            </div>
            <p className="text-sm text-gray-400 mt-6">
              This is not a chatbot. This is a legal productivity system.
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-black/30 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why LexCoworkAI Exists</h2>
            <p className="text-gray-300 text-lg">Legal work today is broken</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <AlertTriangle className="w-10 h-10 text-red-400 mb-2" />
                <CardTitle className="text-white">Slow</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Weeks to review a single contract</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <AlertTriangle className="w-10 h-10 text-orange-400 mb-2" />
                <CardTitle className="text-white">Expensive</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Legal costs drain startup budgets</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <AlertTriangle className="w-10 h-10 text-yellow-400 mb-2" />
                <CardTitle className="text-white">Fragmented</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Tools scattered across platforms</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <AlertTriangle className="w-10 h-10 text-purple-400 mb-2" />
                <CardTitle className="text-white">Risky</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Generic AI makes dangerous mistakes</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold mb-6">LexCoworkAI fixes this by combining:</h3>
            <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="flex flex-col items-center">
                <Sparkles className="w-8 h-8 text-blue-400 mb-2" />
                <p className="text-slate-200">Agentic AI Workers</p>
              </div>
              <div className="flex flex-col items-center">
                <SearchCheck className="w-8 h-8 text-green-400 mb-2" />
                <p className="text-slate-200">RAG Retrieval</p>
              </div>
              <div className="flex flex-col items-center">
                <Shield className="w-8 h-8 text-orange-400 mb-2" />
                <p className="text-slate-200">Legal Guardrails</p>
              </div>
              <div className="flex flex-col items-center">
                <Users className="w-8 h-8 text-purple-400 mb-2" />
                <p className="text-slate-200">Cowork Orchestration</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              What You Can Do with LexCoworkAI
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:border-gray-500 transition-colors">
              <CardHeader>
                <FileCheck className="w-12 h-12 text-blue-400 mb-4" />
                <CardTitle className="text-2xl text-white">Contract Review & Redlining</CardTitle>
                <CardDescription className="text-base text-gray-300">
                  Professional contract analysis with zero guesswork
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">NDAs, MSAs, SOWs, employment contracts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">Clause extraction and risk scoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">Redlines generated as diffs, never silent edits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">Plain-English summaries for business users</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:border-gray-500 transition-colors">
              <CardHeader>
                <FileText className="w-12 h-12 text-green-400 mb-4" />
                <CardTitle className="text-2xl text-white">Policy & Document Drafting</CardTitle>
                <CardDescription className="text-base text-gray-300">
                  Jurisdiction-aware legal document generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">Privacy Policy, Terms of Service, HR policies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">Jurisdiction-aware (India / USA)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">Built from approved templates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">Uses your knowledge base</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:border-gray-500 transition-colors">
              <CardHeader>
                <ClipboardCheck className="w-12 h-12 text-orange-400 mb-4" />
                <CardTitle className="text-2xl text-white">Compliance Checklists</CardTitle>
                <CardDescription className="text-base text-gray-300">
                  Clear, actionable compliance steps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">India DPDP Act</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">CCPA, GDPR, SOC2</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">Clear, actionable compliance steps</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-400 italic">(not legal advice)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:border-gray-500 transition-colors">
              <CardHeader>
                <SearchCheck className="w-12 h-12 text-purple-400 mb-4" />
                <CardTitle className="text-2xl text-white">Legal Research</CardTitle>
                <CardDescription className="text-base text-gray-300">
                  Grounded, not hallucinated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">RAG over your documents and legal sources</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">Citations attached</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-200">"No source = no claim" enforcement</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Built Different Section */}
      <section className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built Different (And Safer)
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <Sparkles className="w-10 h-10 text-blue-400 mb-2" />
                <CardTitle className="text-white">Cowork-Style AI Workers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Specialized AI workers coordinated by an Orchestrator, not one generic model.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <Shield className="w-10 h-10 text-green-400 mb-2" />
                <CardTitle className="text-white">Legal Guardrails by Design</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• No legal advice</li>
                  <li>• No court strategy</li>
                  <li>• No hidden actions</li>
                  <li>• Human approval required</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <Globe className="w-10 h-10 text-orange-400 mb-2" />
                <CardTitle className="text-white">Jurisdiction-Aware</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-2">Every task is explicitly tagged:</p>
                <div className="flex gap-2 mb-2">
                  <Badge className="bg-gray-700 text-white border-gray-600">🇺🇸 USA</Badge>
                  <Badge className="bg-gray-700 text-white border-gray-600">🇮🇳 India</Badge>
                </div>
                <p className="text-sm text-gray-300">No cross-jurisdiction mixing. Ever.</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <FileText className="w-10 h-10 text-purple-400 mb-2" />
                <CardTitle className="text-white">Full Audit Trail</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-2">Every action is logged:</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Inputs & sources</li>
                  <li>• Drafts & approvals</li>
                  <li>• Final outputs</li>
                </ul>
                <p className="text-sm font-medium text-white mt-2">Enterprise-ready from day one.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-20 bg-gradient-to-b from-black/20 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Who LexCoworkAI Is For
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <CardTitle className="text-white">Founders & SMBs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Review contracts without waiting weeks</p>
              </CardContent>
            </Card>

            <Card className="text-center bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <Scale className="w-8 h-8 text-green-400" />
                </div>
                <CardTitle className="text-white">In-House Legal Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Speed up first-pass reviews</p>
              </CardContent>
            </Card>

            <Card className="text-center bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                  <FileCheck className="w-8 h-8 text-orange-400" />
                </div>
                <CardTitle className="text-white">Legal Consultants</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Structured research and intake</p>
              </CardContent>
            </Card>

            <Card className="text-center bg-gray-800/50 border-gray-700 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                  <Scale className="w-8 h-8 text-purple-400" />
                </div>
                <CardTitle className="text-white">Attorneys</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Draft faster, stay in control</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 max-w-3xl mx-auto">
            <Card className="bg-red-900/20 border-red-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-center text-xl text-white">What LexCoworkAI Is NOT</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-bold">✗</span>
                    <span>Not a legal advice platform</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-bold">✗</span>
                    <span>Not a replacement for lawyers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-bold">✗</span>
                    <span>Not an autonomous agent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-bold">✗</span>
                    <span>Not a generic AI chatbot</span>
                  </div>
                </div>
                <p className="text-center mt-6 text-lg font-semibold text-white">
                  LexCoworkAI assists. Humans decide.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-black/40 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Lock className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Security & Trust
            </h2>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <Shield className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-gray-200">Role-based access</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <Lock className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <p className="text-gray-200">Tenant-isolated data</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <Globe className="w-10 h-10 text-orange-400 mx-auto mb-3" />
                <p className="text-gray-200">Jurisdiction-scoped RAG</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <Users className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                <p className="text-gray-200">Human-approved actions</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <FileCheck className="w-10 h-10 text-pink-400 mx-auto mb-3" />
                <p className="text-gray-200">SOC2 & GDPR ready</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-black/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Get Early Access
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Build legal work faster, safer, and with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://app.cal.com/event-types/2863209" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2 w-full sm:w-auto bg-white text-black hover:bg-gray-200">
                Request Early Access <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <a href="https://app.cal.com/event-types/2863209" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-gray-500 text-white hover:bg-white/10">
                Book a Demo
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/60 border-t border-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center">
              <span className="text-2xl font-bold">LexCoworkAI</span>
            </div>
            <div className="text-sm text-gray-400 text-center md:text-right">
              <p className="mb-2">
                Legal AI Platform • Contract Review • Compliance • Policy Drafting
              </p>
              <p className="text-xs">
                India & USA • Jurisdiction-Aware • Human-Governed • Enterprise-Ready
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p className="mb-2">
              Keywords: LexCoworkAI, legal AI platform, AI legal assistant India, AI legal assistant USA,
              contract review AI, legal RAG platform, Cowork AI alternative, compliance AI, DPDP AI, CCPA AI
            </p>
            <p>
              © {new Date().getFullYear()} LexCoworkAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
