import React, { useState, useEffect, useRef } from 'react';
import { Hero } from './components/Hero';
import { SubmissionForm } from './components/SubmissionForm';
import { VirtualBreakroom } from './components/VirtualBreakroom';
import { OfficeProtocols } from './components/OfficeProtocols';
import { api, isSupabaseConfigured } from './supabaseClient';
import type { Submission, Comment } from './supabaseClient';
import {
  PlusCircle,
  Database,
  Award,
  Utensils,
  MessageSquare,
  Briefcase,
  RefreshCw,
  FileText,
  Lock,
  ShieldCheck,
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feed' | 'protocols'>('feed');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('firm_auth') === 'true';
  });

  const [submissions, setSubmissions] = useState<(Submission & { comments: Comment[] })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalComments: 0,
    uniqueUsers: 0,
  });

  // Persistent Suno Background Audio Player (hoisted to App root)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.4;
    }
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, []);

  // Gracefully handle browser tab switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.hidden) {
        if (!audio.paused) {
          wasPlayingRef.current = true;
          audio.pause();
          setIsPlaying(false);
        } else {
          wasPlayingRef.current = false;
        }
      } else {
        if (wasPlayingRef.current) {
          audio
            .play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch((err) => {
              console.warn('Audio auto-resume on tab focus was prevented:', err);
            });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const toggleAudio = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('Audio playback error:', err);
          setIsPlaying(false);
        });
    }
  };

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

  // Keep auth state fresh from sessionStorage
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(sessionStorage.getItem('firm_auth') === 'true');
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-brand-cream/50 flex flex-col selection:bg-brand-gold/30">
      {/* Root HTML5 Audio Element — Stays alive continuously across tab switching */}
      <audio
        ref={audioRef}
        src="/breakroom-theme.mp3"
        loop={true}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Logo / Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-law-navy flex items-center justify-center border border-brand-gold/30 shadow-inner shrink-0">
                <Utensils className="w-5 h-5 text-brand-gold-bright" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-lg sm:text-xl md:text-2xl text-brand-law-navy tracking-tight">
                    The Virtual Breakroom
                  </span>
                  <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] uppercase tracking-wider font-bold">
                    v1.0
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Lunch & Learn Cultural Hub
                </span>
              </div>
            </div>

            {/* Mobile Audio & Submit shortcut */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                onClick={toggleAudio}
                className={`p-2 rounded-lg border text-xs font-semibold ${
                  isPlaying
                    ? 'bg-brand-law-navy text-brand-gold-bright border-brand-gold/40'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
                title={isPlaying ? 'Mute Theme Song' : 'Play Theme Song'}
              >
                {isPlaying ? '🔊' : '🎵'}
              </button>
            </div>
          </div>

          {/* Center: Top-Level Dual-Tab Switcher */}
          <nav className="flex items-center justify-center sm:justify-start gap-1 p-1 bg-slate-100 rounded-xl border border-brand-gold/20 shadow-inner self-center lg:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('feed')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'feed'
                  ? 'bg-brand-law-navy text-brand-gold-bright shadow-sm border border-brand-gold/30'
                  : 'text-slate-600 hover:text-brand-law-navy hover:bg-white/70'
              }`}
            >
              <span>🥪 Lunch & Learn Feed</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('protocols')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'protocols'
                  ? 'bg-brand-law-navy text-brand-gold-bright shadow-sm border border-brand-gold/30'
                  : 'text-slate-600 hover:text-brand-law-navy hover:bg-white/70'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-brand-gold-bright" />
              <span>📜 Office Protocols & Standards</span>
              {!isAuthenticated && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Passcode verification active" />
              )}
            </button>
          </nav>

          {/* Right: Actions, Audio & Authentication Status */}
          <div className="flex items-center justify-end gap-3">
            {/* Persistent Suno Audio Player Pill in Header Bar */}
            <button
              type="button"
              onClick={toggleAudio}
              className={`hidden sm:inline-flex px-3 py-1.5 rounded-full border items-center gap-1.5 transition-all cursor-pointer font-medium text-xs shadow-sm ${
                isPlaying
                  ? 'bg-brand-law-navy text-brand-gold-bright border-brand-gold/40 hover:bg-brand-primary'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-brand-gold/30 hover:text-brand-law-navy'
              }`}
              title={isPlaying ? 'Click to Mute Suno Theme Song' : 'Click to Play Suno Theme Song'}
              aria-label={isPlaying ? 'Mute Theme Song' : 'Play Theme Song'}
            >
              {isPlaying ? (
                <>
                  <span className="flex items-center gap-1">
                    <span>🔊</span>
                    <span>Mute Theme</span>
                  </span>
                  <span className="flex items-end gap-0.5 h-3 ml-0.5" aria-hidden="true">
                    <span className="w-0.5 bg-brand-gold-bright audio-wave-bar rounded-full inline-block"></span>
                    <span className="w-0.5 bg-brand-gold-bright audio-wave-bar rounded-full inline-block"></span>
                    <span className="w-0.5 bg-brand-gold-bright audio-wave-bar rounded-full inline-block"></span>
                    <span className="w-0.5 bg-brand-gold-bright audio-wave-bar rounded-full inline-block"></span>
                  </span>
                </>
              ) : (
                <span className="flex items-center gap-1">
                  <span>🎵</span>
                  <span>Play Theme</span>
                </span>
              )}
            </button>

            {/* Passcode Auth Indicator */}
            {isAuthenticated ? (
              <div
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold"
                title="Verified with Potter Law Group Firm Passcode"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Potter Verified</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('protocols')}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-brand-gold/30 hover:bg-amber-100 text-xs font-semibold cursor-pointer"
                title="Click to view & enter firm passcode"
              >
                <Lock className="w-3.5 h-3.5 text-brand-gold" />
                <span>Passcode Protected</span>
              </button>
            )}

            {/* Supabase Connection Status Pill */}
            <div
              className={`hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                isSupabaseConfigured
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-brand-gold/20'
              }`}
              title={
                isSupabaseConfigured
                  ? 'Connected to live Supabase project'
                  : 'Running locally in localStorage fallback mode'
              }
            >
              <Database
                className={`w-3.5 h-3.5 ${
                  isSupabaseConfigured ? 'text-emerald-600' : 'text-brand-gold'
                }`}
              />
              <span>{isSupabaseConfigured ? 'Supabase Live' : 'Demo Storage'}</span>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-brand-law-navy text-white text-xs md:text-sm font-semibold hover:bg-brand-primary border border-brand-gold/30 hover:border-brand-gold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-brand-gold-bright" />
              <span>Record Lunch</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: 🥪 Lunch & Learn Feed (Displays video review feed, submission modal, and Suno player) */}
        <div className={activeTab === 'feed' ? 'block space-y-8' : 'hidden'}>
          {/* Hero Section with Countdown */}
          <Hero />

          {/* Global Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Submissions */}
            <div className="bg-white rounded-xl p-5 border border-brand-gold/15 shadow-sm hover:border-brand-gold/35 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                  Total Submissions
                </span>
                <div className="p-2 rounded-lg bg-brand-cream border border-brand-gold/10">
                  <Utensils className="w-4 h-4 text-brand-gold" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-serif text-2xl font-bold text-brand-law-navy">
                  {stats.totalSubmissions}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Meals Logged</span>
              </div>
            </div>

            {/* Card 2: Comments / Banter */}
            <div className="bg-white rounded-xl p-5 border border-brand-gold/15 shadow-sm hover:border-brand-gold/35 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                  Active Banter
                </span>
                <div className="p-2 rounded-lg bg-brand-cream border border-brand-gold/10">
                  <MessageSquare className="w-4 h-4 text-brand-gold" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-serif text-2xl font-bold text-brand-law-navy">
                  {stats.totalComments}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Threads Posted</span>
              </div>
            </div>

            {/* Card 3: Active Lawyers / Users */}
            <div className="bg-white rounded-xl p-5 border border-brand-gold/15 shadow-sm hover:border-brand-gold/35 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                  Active Lunchers
                </span>
                <div className="p-2 rounded-lg bg-brand-cream border border-brand-gold/10">
                  <Briefcase className="w-4 h-4 text-brand-gold" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-serif text-2xl font-bold text-brand-law-navy">
                  {stats.uniqueUsers}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Unique Colleagues</span>
              </div>
            </div>

            {/* Card 4: Potter Budget Reimbursement Rate */}
            <div className="bg-white rounded-xl p-5 border border-brand-gold/15 shadow-sm hover:border-brand-gold/35 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                  Potter&apos;s Reimbursement
                </span>
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

          {/* Virtual Breakroom Feed Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold text-brand-law-navy">
                  The Virtual Breakroom
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Explore what your colleagues ordered and join the conversation
                </p>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 text-slate-500 hover:text-brand-law-navy rounded-lg hover:bg-slate-100 border border-slate-200 transition-all flex items-center gap-1.5 text-xs font-semibold bg-white cursor-pointer"
                title="Refresh breakroom posts"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-gold' : ''}`}
                />
                <span className="hidden sm:inline">Refresh Feed</span>
              </button>
            </div>

            <VirtualBreakroom
              submissions={submissions}
              onRefresh={handleRefresh}
              isLoading={isLoading}
              audioState={{ isPlaying, toggleAudio }}
            />
          </div>
        </div>

        {/* TAB 2: 📜 Office Protocols & Standards */}
        <div className={activeTab === 'protocols' ? 'block' : 'hidden'}>
          <OfficeProtocols
            isAuthenticated={isAuthenticated}
            onAuthenticate={() => setIsAuthenticated(true)}
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
            Confidential &amp; Proprietary. The Virtual Breakroom is an internal media portal intended solely for personnel of The Potter Law Group. Uploads must exclude privileged client data, active case files, or sensitive financial information.
          </p>
          <p className="text-slate-400 text-xs font-light">
            Designed to bring remote teams together over shared meals, standards, and banter.
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
