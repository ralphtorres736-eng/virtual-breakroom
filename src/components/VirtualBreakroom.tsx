import React, { useState, useEffect } from 'react';
import { api, supabase, isSupabaseConfigured } from '../supabaseClient';
import type { Submission, Comment } from '../supabaseClient';
import { Search, MessageSquare, Play, Calendar, User, Send, ChevronDown, ChevronUp, Image as ImageIcon, Archive, Lock, Info } from 'lucide-react';
import { getMonthYearTag, getCurrentMonthYear } from '../utils/dateUtils';

const FIRM_PASSCODE = 'Potter2026';

interface VirtualBreakroomProps {
  submissions: (Submission & { comments: Comment[] })[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const VirtualBreakroom: React.FC<VirtualBreakroomProps> = ({ submissions, onRefresh, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'video'>('all');
  
  // Archive Vault states
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [selectedVaultMonth, setSelectedVaultMonth] = useState<string>('');
  const [isAdminArchiving, setIsAdminArchiving] = useState(false);

  // Track open comment sections
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  
  // Track new comment form states
  const [commentNames, setCommentNames] = useState<Record<string, string>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<Record<string, boolean>>({});
  const [localComments, setLocalComments] = useState<Record<string, Comment[]>>({});

  // Auth state for session persistence
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem("firm_auth") === "true");
  const [commentPasscodes, setCommentPasscodes] = useState<Record<string, string>>({});
  const [commentErrors, setCommentErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsAuthenticated(sessionStorage.getItem("firm_auth") === "true");
  }, [submissions, isLoading]);

  // Staff Guide & Etiquette Banner state
  const [showGuide, setShowGuide] = useState<boolean>(() => {
    const saved = localStorage.getItem('hide_staff_etiquette');
    return saved !== 'true';
  });

  const toggleGuide = () => {
    setShowGuide((prev) => {
      const next = !prev;
      localStorage.setItem('hide_staff_etiquette', String(!next));
      return next;
    });
  };

  // Calculate unique months dynamically from submissions
  const availableMonths = Array.from(
    new Set(submissions.map((sub) => getMonthYearTag(sub.created_at)))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const activeVaultMonth = selectedVaultMonth || (availableMonths[0] || getCurrentMonthYear());

  const handleArchiveCurrentMonth = async () => {
    const password = prompt("Enter Admin PIN to archive current month's posts:");
    if (password === null) return;
    if (password !== FIRM_PASSCODE) {
      alert('Incorrect PIN. Access Denied.');
      return;
    }
    
    setIsAdminArchiving(true);
    try {
      const currentMonth = getCurrentMonthYear();
      const toArchive = submissions.filter(
        (sub) => getMonthYearTag(sub.created_at) === currentMonth && sub.receipt_url !== 'archived'
      );
      
      if (toArchive.length === 0) {
        alert('No active posts to archive for the current month.');
        return;
      }
      
      await Promise.all(toArchive.map(sub => api.archiveSubmission(sub.id)));
      alert(`Successfully archived ${toArchive.length} posts to the Vault.`);
      onRefresh();
    } catch (err) {
      console.error('Error archiving posts:', err);
      alert('An error occurred while archiving posts.');
    } finally {
      setIsAdminArchiving(false);
    }
  };

  // Load saved commenter name from localStorage if available
  const getSavedCommenterName = () => {
    return localStorage.getItem('firm_table_commenter_name') || '';
  };

  const toggleComments = (id: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
    
    // Initialize commenter name from localStorage if not set
    if (!commentNames[id]) {
      setCommentNames((prev) => ({
        ...prev,
        [id]: getSavedCommenterName(),
      }));
    }
  };

  const handleAddComment = async (e: React.FormEvent, submissionId: string) => {
    e.preventDefault();
    const commentAuthorName = commentNames[submissionId]?.trim();
    const commentBodyText = commentTexts[submissionId]?.trim();
    const targetSubmissionId = submissionId;

    if (!commentAuthorName || !commentBodyText) return;

    // Hardening passcode check
    const isAlreadyAuth = sessionStorage.getItem("firm_auth") === "true";
    if (!isAlreadyAuth) {
      const passcode = commentPasscodes[targetSubmissionId]?.trim();
      if (passcode !== FIRM_PASSCODE) {
        setCommentErrors((prev) => ({
          ...prev,
          [targetSubmissionId]: "Invalid Firm Passcode."
        }));
        return;
      }
      sessionStorage.setItem("firm_auth", "true");
      setIsAuthenticated(true);
      setCommentErrors((prev) => ({
        ...prev,
        [targetSubmissionId]: ""
      }));
    }

    setIsSubmittingComment((prev) => ({ ...prev, [targetSubmissionId]: true }));
    
    // Save commenter name locally for convenience
    localStorage.setItem('firm_table_commenter_name', commentAuthorName);
    
    // Clear the input field immediately upon clicking "Post Banter"
    setCommentTexts((prev) => ({ ...prev, [targetSubmissionId]: '' }));
    setCommentPasscodes((prev) => ({ ...prev, [targetSubmissionId]: '' }));

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('lunch_comments')
          .insert([
            {
              submission_id: targetSubmissionId,
              employee_name: commentAuthorName || 'Anonymous Staff',
              comment_text: commentBodyText,
              comment: commentBodyText
            }
          ]);

        if (error) throw error;
        
        onRefresh();
      } catch (error) {
        console.error("Supabase Comment Insert Error:", error);
        
        // Append the new comment to local component state so the user sees their comment render immediately without blocking the interaction
        const fallbackComment: Comment = {
          id: `com-failed-${Date.now()}`,
          submission_id: targetSubmissionId,
          employee_name: commentAuthorName || 'Anonymous Staff',
          comment_text: commentBodyText,
          created_at: new Date().toISOString(),
        };
        
        setLocalComments((prev) => ({
          ...prev,
          [targetSubmissionId]: [...(prev[targetSubmissionId] || []), fallbackComment],
        }));
      } finally {
        setIsSubmittingComment((prev) => ({ ...prev, [targetSubmissionId]: false }));
      }
    } else {
      // Demo / Fallback Mode using api.addComment
      try {
        await api.addComment(targetSubmissionId, commentAuthorName, commentBodyText);
        onRefresh();
      } catch (err) {
        console.error('Failed to post comment in local mode:', err);
        const fallbackComment: Comment = {
          id: `com-failed-${Date.now()}`,
          submission_id: targetSubmissionId,
          employee_name: commentAuthorName || 'Anonymous Staff',
          comment_text: commentBodyText,
          created_at: new Date().toISOString(),
        };
        
        setLocalComments((prev) => ({
          ...prev,
          [targetSubmissionId]: [...(prev[targetSubmissionId] || []), fallbackComment],
        }));
      } finally {
        setIsSubmittingComment((prev) => ({ ...prev, [targetSubmissionId]: false }));
      }
    }
  };

  // Filter and search logic
  const filteredSubmissions = submissions.filter((sub) => {
    const currentMonth = getCurrentMonthYear();
    const isPostArchived = sub.receipt_url === 'archived' || getMonthYearTag(sub.created_at) !== currentMonth;

    if (isVaultOpen) {
      // Vault View: show posts from the selected month/year
      if (getMonthYearTag(sub.created_at) !== activeVaultMonth) return false;
    } else {
      // Active Feed View: show only non-archived posts from the current month
      if (isPostArchived) return false;
    }

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      sub.employee_name.toLowerCase().includes(query) ||
      sub.restaurant_name.toLowerCase().includes(query) ||
      sub.comment.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (filterType === 'video') return !!sub.video_url;
    return true;
  });

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl border border-brand-gold/15 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees, restaurants, or notes..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold/50 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Filter Feed:</span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-full border transition-all ${
                filterType === 'all'
                  ? 'bg-brand-law-navy text-white border-brand-law-navy font-medium'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Meals
            </button>
            <button
              onClick={() => setFilterType('video')}
              className={`px-3 py-1.5 rounded-full border flex items-center gap-1 transition-all ${
                filterType === 'video'
                  ? 'bg-brand-law-navy text-white border-brand-law-navy font-medium'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              With Videos
            </button>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          {/* Archive Vault Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVaultOpen(!isVaultOpen)}
              className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 transition-all ${
                isVaultOpen
                  ? 'bg-brand-gold text-brand-law-navy border-brand-gold font-semibold shadow-sm'
                  : 'bg-amber-50 text-brand-gold border-brand-gold/20 hover:bg-brand-gold/10'
              }`}
              title="Access Archived Vault"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive Vault</span>
            </button>

            {isVaultOpen ? (
              <select
                value={activeVaultMonth}
                onChange={(e) => setSelectedVaultMonth(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-brand-gold/30 bg-white text-brand-law-navy focus:outline-none focus:ring-1 focus:ring-brand-gold text-xs font-semibold cursor-pointer"
              >
                {availableMonths.length > 0 ? (
                  availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))
                ) : (
                  <option value={getCurrentMonthYear()}>{getCurrentMonthYear()}</option>
                )}
              </select>
            ) : (
              <button
                onClick={handleArchiveCurrentMonth}
                disabled={isAdminArchiving}
                className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-brand-law-navy flex items-center gap-1.5 transition-all disabled:opacity-50 text-xs font-semibold"
                title="Archive current month posts (Admin Only)"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAdminArchiving ? 'Archiving...' : 'Archive Month'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Staff Guide & Etiquette Banner */}
      {showGuide ? (
        <div className="border border-[#c5a059]/30 bg-[#132238]/60 p-5 rounded-xl space-y-4 shadow-md transition-all duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-[#c5a059]/20">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#dfba73]" />
              <span className="font-serif text-sm md:text-base font-bold tracking-tight text-white">
                Welcome to The Virtual Breakroom <span className="text-[#dfba73] font-sans font-normal text-xs mx-1">//</span> How to Participate
              </span>
            </div>
            <button
              onClick={toggleGuide}
              type="button"
              className="text-xs font-semibold text-[#dfba73] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Hide Guide</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#dfba73] uppercase tracking-wider">1. Enjoy Your Meal</h4>
              <p className="text-slate-200 text-[11px] font-light leading-normal">
                Take a well-deserved break and order your lunch on the firm every last Thursday of the month.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#dfba73] uppercase tracking-wider">2. Record a Quick Video (15-30s)</h4>
              <p className="text-slate-200 text-[11px] font-light leading-normal">
                Click '+ Record Lunch' to post a short, fun video preview of your meal and say hello to the team.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#dfba73] uppercase tracking-wider">3. Privacy First</h4>
              <p className="text-slate-200 text-[11px] font-light leading-normal">
                Ensure no client case files, computer monitors, or confidential documents are visible in the background of your video.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#dfba73] uppercase tracking-wider">4. Polite & Collegial Banter</h4>
              <p className="text-slate-200 text-[11px] font-light leading-normal">
                Expand the comment threads under your colleagues' posts to share recommendations and friendly, supportive banter.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-[#c5a059]/30 bg-[#132238]/60 px-5 py-3 rounded-xl flex items-center justify-between shadow-sm transition-all duration-300">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#dfba73]" />
            <span className="font-serif text-xs md:text-sm font-bold tracking-tight text-[#dfba73]">
              Welcome to The Virtual Breakroom // How to Participate
            </span>
          </div>
          <button
            onClick={toggleGuide}
            type="button"
            className="text-xs font-semibold text-[#dfba73] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Show Guide</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grid Container */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-10 h-10 border-4 border-brand-gold/25 border-t-brand-gold rounded-full animate-spin mb-4"></div>
          <p className="text-sm">Fetching breakroom feed...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-brand-gold/15 shadow-sm text-slate-500">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-brand-law-navy">No Entries Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Be the first to submit today's review or refine your search parameters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSubmissions.map((sub) => {
            const combinedComments = [
              ...(sub.comments || []),
              ...(localComments[sub.id] || [])
            ];
            const hasComments = combinedComments.length > 0;
            const commentsOpen = !!expandedComments[sub.id];

            return (
              <div
                key={sub.id}
                className="bg-white rounded-xl border border-brand-gold/15 overflow-hidden flex flex-col gold-shadow gold-shadow-hover transition-all duration-300"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 bg-brand-cream/40 flex justify-between items-start gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-brand-gold" />
                      <h3 className="font-serif font-bold text-brand-law-navy text-base leading-tight">
                        {sub.employee_name}
                      </h3>
                    </div>
                    <p className="text-xs text-brand-slate-light font-medium truncate max-w-[280px]" title={sub.restaurant_name}>
                      {sub.restaurant_name}
                    </p>
                  </div>

                  {/* Month/Year Badge */}
                  <span 
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand-gold/10 border border-brand-gold/25 text-[10px] font-bold text-brand-gold tracking-wide uppercase"
                    title="Catering Month Tag"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {getMonthYearTag(sub.created_at)}
                  </span>
                </div>

                {/* Card Video Player / Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Native HTML5 Video Element */}
                  {sub.video_url ? (
                    <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-950 aspect-video flex items-center justify-center">
                      <video
                        src={sub.video_url || undefined}
                        controls
                        preload="none"
                        className="w-full h-full object-cover max-h-[220px]"
                        poster="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400"
                      >
                        Your browser does not support native video playback.
                      </video>
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-50 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <Play className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-[11px] font-medium text-slate-500">No review video attached</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Meal uploaded without clips</p>
                    </div>
                  )}

                  {/* Review Text */}
                  <blockquote className="border-l-2 border-brand-gold/40 pl-3 italic text-xs md:text-sm text-slate-700 font-light leading-relaxed my-2">
                    "{sub.comment}"
                  </blockquote>

                  {/* Timestamp & Meta */}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-300" />
                    <span>{formatDate(sub.created_at)}</span>
                  </div>
                </div>

                {/* Card Footer: Collapsible Comment Button */}
                <div className="border-t border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => toggleComments(sub.id)}
                    className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-semibold text-brand-law-navy hover:text-brand-gold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-brand-gold" />
                      {hasComments ? (
                        <span>Banter Threads ({combinedComments.length})</span>
                      ) : (
                        <span>Start Team Banter</span>
                      )}
                    </span>
                    {commentsOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {/* Comment Section (Expandable) */}
                  {commentsOpen && (
                    <div className="px-5 pb-5 border-t border-slate-100 bg-white/70 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      {/* Comment list */}
                      {hasComments && (
                        <div className="space-y-3 pt-3 max-h-[200px] overflow-y-auto pr-1">
                          {combinedComments.map((com) => (
                            <div key={com.id} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 text-xs">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-brand-law-navy">{com.employee_name}</span>
                                <span className="text-[9px] text-slate-400">{formatDate(com.created_at)}</span>
                              </div>
                              <p className="text-slate-600 font-light leading-relaxed">{com.comment_text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment Form */}
                      <form onSubmit={(e) => handleAddComment(e, sub.id)} className="space-y-2 pt-2 border-t border-slate-100/80">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Your Name"
                            value={commentNames[sub.id] || ''}
                            onChange={(e) =>
                              setCommentNames((prev) => ({ ...prev, [sub.id]: e.target.value }))
                            }
                            className="px-2.5 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold/50 sm:col-span-1"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Add your banter..."
                            value={commentTexts[sub.id] || ''}
                            onChange={(e) =>
                              setCommentTexts((prev) => ({ ...prev, [sub.id]: e.target.value }))
                            }
                            className="px-2.5 py-1.5 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold/50 sm:col-span-2"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <div className="flex-1">
                            {!isAuthenticated && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="password"
                                  required
                                  placeholder="Firm Passcode"
                                  value={commentPasscodes[sub.id] || ''}
                                  onChange={(e) => {
                                    setCommentPasscodes((prev) => ({ ...prev, [sub.id]: e.target.value }));
                                    setCommentErrors((prev) => ({ ...prev, [sub.id]: '' }));
                                  }}
                                  className="px-2.5 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-brand-gold/50 w-36"
                                />
                                {commentErrors[sub.id] && (
                                  <span className="text-red-500 text-[10px] font-medium">{commentErrors[sub.id]}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            type="submit"
                            disabled={isSubmittingComment[sub.id]}
                            className="px-3 py-1 bg-brand-law-navy hover:bg-brand-primary text-white text-[10px] font-semibold rounded border border-brand-gold/20 hover:border-brand-gold flex items-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            {isSubmittingComment[sub.id] ? (
                              <span>Posting...</span>
                            ) : (
                              <>
                                <Send className="w-3 h-3 text-brand-gold" />
                                <span>Post Banter</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
