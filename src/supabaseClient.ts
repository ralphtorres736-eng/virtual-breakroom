import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Detect if we have real Supabase config
export const isSupabaseConfigured =
  supabaseUrl.trim() !== '' &&
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  supabaseAnonKey.trim() !== '' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface Submission {
  id: string;
  employee_name: string;
  restaurant_name: string;
  comment: string;
  video_url: string | null;
  receipt_url: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  submission_id: string;
  employee_name: string;
  comment_text: string;
  created_at: string;
}

// In-memory cache for Object URLs created during mock file uploads
const mockFileObjectUrls: Record<string, string> = {};

// Seed Data for Mock Mode
const SEED_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-1',
    employee_name: 'Harvey Specter',
    restaurant_name: 'Delmonico\'s Steakhouse (Dry-Aged Ribeye)',
    comment: 'Winning the class-action suit calls for a serious steak. Mrs. Potter knows how to keep the partners motivated. The ribeye was cooked to a perfect medium-rare.',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-chef-serving-a-meat-dish-42352-large.mp4',
    receipt_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=600',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
  },
  {
    id: 'sub-2',
    employee_name: 'Donna Paulsen',
    restaurant_name: 'Luke\'s Lobster (Truffle Lobster Roll)',
    comment: 'I don\'t need a receipt to know this is the best lobster roll in the city. Donna-approved, decadently buttery, and Mrs. Potter was kind enough to double the truffle topping!',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-eating-a-truffle-lobster-roll-at-a-restaurant-52119-large.mp4', // Fallback sample video
    receipt_url: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=600',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(), // 1 day ago
  },
  {
    id: 'sub-3',
    employee_name: 'Louis Litt',
    restaurant_name: 'Le Bernardin (Steamed Salmon & Microgreens)',
    comment: 'A refined palate requires refined sustenance before trial prep. Excellent salmon, steamed to absolute silky perfection. My associate tried to steal a bite, but he was Litt-up immediately.',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-fillet-of-salmon-with-vegetables-42337-large.mp4',
    receipt_url: 'https://images.unsplash.com/photo-1556742596-879685949d88?auto=format&fit=crop&q=80&w=600',
    created_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString(), // 2 days ago
  }
];

const SEED_COMMENTS: Comment[] = [
  {
    id: 'com-1',
    submission_id: 'sub-1',
    employee_name: 'Mike Ross',
    comment_text: 'You forgot to mention you made me write the brief while you enjoyed that steak, Harvey!',
    created_at: new Date(Date.now() - 1.5 * 3600000).toISOString(),
  },
  {
    id: 'com-2',
    submission_id: 'sub-1',
    employee_name: 'Donna Paulsen',
    comment_text: 'He knows, Mike. He just prefers the steak to your complaining.',
    created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
  {
    id: 'com-3',
    submission_id: 'sub-2',
    employee_name: 'Louis Litt',
    comment_text: 'Donna, did you save me a bite of that lobster? Tell me you didn\'t eat the whole roll.',
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 'com-4',
    submission_id: 'sub-3',
    employee_name: 'Harvey Specter',
    comment_text: 'Louis, the only thing getting "Litt-up" is your expense report for yogurt.',
    created_at: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
  }
];

// Helper: Get local data
function getLocalSubmissions(): Submission[] {
  const data = localStorage.getItem('firm_table_submissions');
  if (!data) {
    localStorage.setItem('firm_table_submissions', JSON.stringify(SEED_SUBMISSIONS));
    return SEED_SUBMISSIONS;
  }
  return JSON.parse(data);
}

function getLocalComments(): Comment[] {
  const data = localStorage.getItem('firm_table_comments');
  if (!data) {
    localStorage.setItem('firm_table_comments', JSON.stringify(SEED_COMMENTS));
    return SEED_COMMENTS;
  }
  return JSON.parse(data);
}

// Global API Object
export const api = {
  /**
   * Fetch all submissions and their associated comments
   */
  async getSubmissions(): Promise<(Submission & { comments: Comment[] })[]> {
    if (isSupabaseConfigured && supabase) {
      const { data: submissions, error: subError } = await supabase
        .from('lunch_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (subError) throw subError;

      const { data: comments, error: comError } = await supabase
        .from('lunch_comments')
        .select('*')
        .order('created_at', { ascending: true });

      if (comError) throw comError;

      return (submissions || []).map((sub) => ({
        ...sub,
        comments: (comments || []).filter((com) => com.submission_id === sub.id),
      }));
    } else {
      // Local Storage Fallback
      const subs = getLocalSubmissions();
      const coms = getLocalComments();
      
      // Sort submissions by date descending
      const sortedSubs = [...subs].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return sortedSubs.map((sub) => {
        // Resolve temp object URLs if they exist in current browser session
        const video_url = mockFileObjectUrls[sub.id + '_video'] || sub.video_url;
        const receipt_url = mockFileObjectUrls[sub.id + '_receipt'] || sub.receipt_url;

        return {
          ...sub,
          video_url,
          receipt_url,
          comments: coms.filter((com) => com.submission_id === sub.id),
        };
      });
    }
  },

  /**
   * Upload a proof file (video or receipt)
   */
  async uploadFile(file: File, folder: 'videos' | 'receipts', tempId: string): Promise<string> {
    if (isSupabaseConfigured && supabase) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tempId}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lunch-proofs')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('lunch-proofs')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } else {
      // Create local Object URL for instant native rendering
      const objectUrl = URL.createObjectURL(file);
      // Cache it so it persists during this browser tab session
      mockFileObjectUrls[`${tempId}_${folder.slice(0, -1)}`] = objectUrl;

      // Fallback base64 or placeholder URL for standard localStorage representation
      if (file.type.startsWith('image/')) {
        // Return a Promise that resolves to base64, but if it's too big, just return the local object URL
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result as string;
            // Only use base64 if it's small (under 1MB) to prevent quota issues
            if (base64String.length < 1000000) {
              resolve(base64String);
            } else {
              resolve(objectUrl);
            }
          };
          reader.readAsDataURL(file);
        });
      } else {
        // For video files, base64 is way too large, so we just use a royalty-free fallback link for the item
        // while referencing the objectUrl in the session cache.
        return 'https://assets.mixkit.co/videos/preview/mixkit-chef-serving-a-meat-dish-42352-large.mp4';
      }
    }
  },

  /**
   * Create a new lunch submission
   */
  async createSubmission(submission: Omit<Submission, 'id' | 'created_at'>, tempId?: string): Promise<Submission> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('lunch_submissions')
        .insert([submission])
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const subs = getLocalSubmissions();
      const newSub: Submission = {
        ...submission,
        id: `sub-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      
      const lookupId = tempId || 'temp';
      // If we had object URLs registered to a temp ID, transfer them to the real ID
      if (mockFileObjectUrls[`${lookupId}_video`]) {
        mockFileObjectUrls[`${newSub.id}_video`] = mockFileObjectUrls[`${lookupId}_video`];
        delete mockFileObjectUrls[`${lookupId}_video`];
      }

      subs.push(newSub);
      try {
        localStorage.setItem('firm_table_submissions', JSON.stringify(subs));
      } catch (quotaError) {
        console.warn('LocalStorage quota exceeded. Pruning old submissions to save space.', quotaError);
        // Prune down to last 5 items to guarantee space
        while (subs.length > 5) {
          subs.shift();
        }
        try {
          localStorage.setItem('firm_table_submissions', JSON.stringify(subs));
        } catch (innerError) {
          console.error('Failed to write even pruned submissions to LocalStorage:', innerError);
        }
      }
      return newSub;
    }
  },

  /**
   * Add a comment to a submission
   */
  async addComment(submissionId: string, employeeName: string, commentText: string): Promise<Comment> {
    const commentData = {
      submission_id: submissionId,
      employee_name: employeeName,
      comment_text: commentText,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('lunch_comments')
        .insert([commentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const coms = getLocalComments();
      const newCom: Comment = {
        id: `com-${Date.now()}`,
        submission_id: submissionId,
        employee_name: employeeName,
        comment_text: commentText,
        created_at: new Date().toISOString(),
      };
      coms.push(newCom);
      localStorage.setItem('firm_table_comments', JSON.stringify(coms));
      return newCom;
    }
  },

  /**
   * Archive a lunch submission by setting receipt_url to 'archived'
   */
  async archiveSubmission(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('lunch_submissions')
        .update({ receipt_url: 'archived' })
        .eq('id', id);

      if (error) throw error;
    } else {
      const subs = getLocalSubmissions();
      const updated = subs.map((sub) =>
        sub.id === id ? { ...sub, receipt_url: 'archived' } : sub
      );
      localStorage.setItem('firm_table_submissions', JSON.stringify(updated));
    }
  }
};
