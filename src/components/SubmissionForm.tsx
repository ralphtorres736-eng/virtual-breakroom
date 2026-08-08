import React, { useState, useRef } from 'react';
import { api, isSupabaseConfigured } from '../supabaseClient';
import { Upload, X, CheckCircle, AlertCircle, Loader2, FileVideo } from 'lucide-react';

interface SubmissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [employeeName, setEmployeeName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [comment, setComment] = useState('');
  
  // File states
  const [videoFile, setVideoFile] = useState<File | null>(null);
  
  // Upload & UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Validation messages
  const [videoError, setVideoError] = useState('');
  
  // Refs
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setVideoError('Please upload a valid video file.');
      setVideoFile(null);
      return;
    }

    // Check size limit (max 50MB for smooth web uploads)
    if (file.size > 50 * 1024 * 1024) {
      setVideoError('Video file is too large (max 50MB).');
      setVideoFile(null);
      return;
    }

    // Video duration check
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = video.duration;
      // Enforce 30-60 second limit, but allow a wider buffer for demo testing (e.g. 5 to 120 seconds in demo mode, or let user bypass)
      if (duration < 30 || duration > 60) {
        setVideoError(`Note: Standard requirement is 30-60s. Selected video is ${Math.round(duration)}s. You can still upload this, but please aim for 30-60s.`);
      } else {
        setVideoError('');
      }
      setVideoFile(file);
    };
    video.onerror = () => {
      setVideoError('Failed to read video duration. Defaulting to accepted.');
      setVideoFile(file);
    };
    video.src = URL.createObjectURL(file);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim() || !restaurantName.trim() || !comment.trim()) {
      setErrorMsg('Please complete all standard fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const tempId = `temp_${Date.now()}`;
      let videoUrl: string | null = null;

      // 1. Upload Video if present
      if (videoFile) {
        videoUrl = await api.uploadFile(videoFile, 'videos', tempId);
      }

      // 2. Create Submission in DB
      await api.createSubmission({
        employee_name: employeeName.trim(),
        restaurant_name: restaurantName.trim(),
        comment: comment.trim(),
        video_url: videoUrl,
        receipt_url: null,
      }, tempId);

      setSuccessMsg('Meal submission registered successfully! Mrs. Potter has been notified.');
      setEmployeeName('');
      setRestaurantName('');
      setComment('');
      setVideoFile(null);
      
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccessMsg('');
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An unexpected error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="w-full max-w-2xl bg-brand-card rounded-2xl shadow-2xl border border-brand-gold/30 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="bg-brand-law-navy text-white px-6 py-4 flex justify-between items-center border-b border-brand-gold/25">
          <div>
            <h2 className="font-serif text-xl font-bold tracking-tight text-brand-gold-bright">
              Record Lunch & Learn Review
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">Submit your meal and review for the virtual breakroom</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Notification Banners */}
          {errorMsg && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          
          {successMsg && (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isSupabaseConfigured && (
            <div className="bg-amber-50 border border-brand-gold/30 text-amber-800 px-4 py-2 rounded-lg text-xs">
              <strong className="text-amber-900">Demo Mode Active:</strong> Files are loaded locally. Uploaded videos will play in this session, and posts are saved to LocalStorage.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee Name */}
            <div>
              <label className="block text-xs font-semibold text-brand-law-navy uppercase tracking-wider mb-1.5">
                Employee Name
              </label>
              <input
                type="text"
                required
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="e.g., Sarah Jenkins"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent text-sm bg-white"
              />
            </div>

            {/* Restaurant / Meal Name */}
            <div>
              <label className="block text-xs font-semibold text-brand-law-navy uppercase tracking-wider mb-1.5">
                Restaurant & Meal Name
              </label>
              <input
                type="text"
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="e.g., Main Street Cafe (Chicken Caesar)"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent text-sm bg-white"
              />
            </div>
          </div>

          {/* Comment / Review */}
          <div>
            <label className="block text-xs font-semibold text-brand-law-navy uppercase tracking-wider mb-1.5">
              Meal Review / Notes
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide a review of your meal or a note to the team..."
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent text-sm bg-white"
            />
          </div>

          {/* File Picker Zone */}
          <div className="pt-1">
            
            {/* Video File Picker */}
            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-brand-law-navy uppercase tracking-wider mb-1.5">
                Meal Video (30-60s preferred)
              </label>
              <div 
                onClick={() => videoInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  videoFile ? 'border-brand-gold bg-brand-gold/5' : 'border-slate-300 hover:border-brand-gold bg-slate-50'
                }`}
              >
                <input 
                  type="file" 
                  ref={videoInputRef}
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />
                
                {videoFile ? (
                  <div className="text-center">
                    <FileVideo className="w-10 h-10 text-brand-gold mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-800 truncate max-w-[320px]">
                      {videoFile.name}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700">Click to Upload Video</p>
                    <p className="text-[10px] text-slate-400 mt-1">MP4, WebM up to 50MB</p>
                  </div>
                )}
              </div>
              {videoError && <p className="text-[10px] text-amber-700 mt-1">{videoError}</p>}
            </div>

          </div>

          {/* Subtle Info Note */}
          <div className="text-[11px] text-slate-500 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/60 text-center font-light leading-normal">
            • Short clips preferred (30–60s) • Ensure no client files or monitors are visible in frame • Enjoy your meal on the firm!
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-brand-law-navy text-white rounded-lg text-sm font-semibold hover:bg-brand-primary border border-brand-gold/30 hover:border-brand-gold flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <span>Submit to Breakroom</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
