import React, { useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { SubmissionForm } from './components/SubmissionForm';
import { VirtualBreakroom } from './components/VirtualBreakroom';
import { api, isSupabaseConfigured } from './supabaseClient';
import type { Submission, Comment } from './supabaseClient';
import { PlusCircle, Database, Award, Utensils, MessageSquare, Briefcase, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [submissions, setSubmissions] = useState<(Submission & { comments: Comment[] })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalComments: 0,
    uniqueUsers: 0,
  });

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSubmissions();
      setSubmissions(data);
      
      // Calculate Stats
      const totalSubmissions = data.length;
      let totalComments = 0;
      const uniqueNames = new Set<string>();
      
      data.forEach((sub) => {
        totalComments += sub.comments?.length || 0;
        if (sub.employee_name) uniqueNames.add(sub.employee_name);
        sub.comments?.forEach((com) => {
          if (com.employee_name) uniqueNames.add(com.employee_name);
        });
      });

      setStats({
        totalSubmissions,
        totalComments,
        uniqueUsers: uniqueNames.size,
      });
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-brand-cream/50 flex flex-col selection:bg-brand-gold/30">
      
      {/* Top Banner (Demo Mode Alert) */}
      {!isSupabaseConfigured && (
        <div className="bg-brand-law-navy text-brand-gold-bright border-b border-brand-gold/25 py-2 px-4 text-xs font-medium text-center">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></span>
            <strong>Running in Demo Mode:</strong> Submissions are persisted in local browser storage. Connect Supabase by setting your environment variables.
          </span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="bg-white border-b border-brand-gold/15 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-law-navy flex items-center justify-center border border-brand-gold/30 shadow-inner">
              <Utensils className="w-5 h-5 text-brand-gold-bright" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-xl md:text-2xl text-brand-law-navy tracking-tight">
                  The Virtual Breakroom
                </span>
                <span className="hidden md:inline px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] uppercase tracking-wider font-bold">
                  v1.0
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Lunch & Learn Cultural Hub
              </span>
            </div>
          </div>

          {/* Actions & Connection Status */}
          <div className="flex items-center gap-4">
            {/* Supabase Connection Status Pill */}
            <div 
              className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                isSupabaseConfigured
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-brand-gold/20'
              }`}
              title={isSupabaseConfigured ? 'Connected to live Supabase project' : 'Running locally in localStorage fallback mode'}
            >
              <Database className={`w-3.5 h-3.5 ${isSupabaseConfigured ? 'text-emerald-600' : 'text-brand-gold'}`} />
              <span>{isSupabaseConfigured ? 'Supabase Live' : 'Demo Storage'}</span>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-brand-law-navy text-white text-xs md:text-sm font-semibold hover:bg-brand-primary border border-brand-gold/30 hover:border-brand-gold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-brand-gold-bright" />
              <span>Record Lunch</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Section with Countdown */}
        <Hero />

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* Card 1: Total Submissions */}
          <div className="bg-white rounded-xl p-5 border border-brand-gold/15 shadow-sm hover:border-brand-gold/35 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Total Submissions</span>
              <div className="p-2 rounded-lg bg-brand-cream border border-brand-gold/10">
                <Utensils className="w-4 h-4 text-brand-gold" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-brand-law-navy">{stats.totalSubmissions}</span>
              <span className="text-[10px] text-slate-400 font-medium">Meals Logged</span>
            </div>
          </div>

          {/* Card 2: Comments / Banter */}
          <div className="bg-white rounded-xl p-5 border border-brand-gold/15 shadow-sm hover:border-brand-gold/35 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Active Banter</span>
              <div className="p-2 rounded-lg bg-brand-cream border border-brand-gold/10">
                <MessageSquare className="w-4 h-4 text-brand-gold" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-brand-law-navy">{stats.totalComments}</span>
              <span className="text-[10px] text-slate-400 font-medium">Threads Posted</span>
            </div>
          </div>

          {/* Card 3: Active Lawyers / Users */}
          <div className="bg-white rounded-xl p-5 border border-brand-gold/15 shadow-sm hover:border-brand-gold/35 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Active Lunchers</span>
              <div className="p-2 rounded-lg bg-brand-cream border border-brand-gold/10">
                <Briefcase className="w-4 h-4 text-brand-gold" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-serif text-2xl font-bold text-brand-law-navy">{stats.uniqueUsers}</span>
              <span className="text-[10px] text-slate-400 font-medium">Unique Colleagues</span>
            </div>
          </div>

          {/* Card 4: Potter Budget Reimbursement Rate */}
          <div className="bg-white rounded-xl p-5 border border-brand-gold/15 shadow-sm hover:border-brand-gold/35 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Potter's Reimbursement</span>
              <div className="p-2 rounded-lg bg-brand-cream border border-brand-gold/10">
                <Award className="w-4 h-4 text-brand-gold" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-serif text-xl font-bold text-brand-law-navy">100% Active</span>
              <span className="text-[10px] text-slate-400 font-medium">Compliments of Mrs. Potter</span>
            </div>
          </div>
        </div>

        {/* virtual Breakroom Feed Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold text-brand-law-navy">
                The Virtual Breakroom
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Explore what your colleagues ordered and join the conversation</p>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 text-slate-500 hover:text-brand-law-navy rounded-lg hover:bg-slate-100 border border-slate-200 transition-all flex items-center gap-1.5 text-xs font-semibold bg-white"
              title="Refresh breakroom posts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-gold' : ''}`} />
              <span className="hidden sm:inline">Refresh Feed</span>
            </button>
          </div>

          <VirtualBreakroom
            submissions={submissions}
            onRefresh={handleRefresh}
            isLoading={isLoading}
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-brand-gold/15 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="font-serif font-semibold text-brand-law-navy text-sm">
            The Potter Law Group — Internal Culture App
          </p>
          <p className="text-slate-500 text-[11px] font-light max-w-2xl mx-auto leading-normal">
            Confidential & Proprietary. The Virtual Breakroom is an internal media portal intended solely for personnel of The Potter Law Group. Uploads must exclude privileged client data, active case files, or sensitive financial information.
          </p>
          <p className="text-slate-400 text-xs font-light">
            Designed to bring remote teams together over shared meals and banter.
          </p>
        </div>
      </footer>

      {/* Submission Form Modal */}
      <SubmissionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default App;
