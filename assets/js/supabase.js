/* ============================================
   Supabase Client Wrapper
   talent.stlucia.studio
   ============================================ */

// ---- Configuration ----
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://edybhgkuttsyoouizwcw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkeWJoZ2t1dHRzeW9vdWl6d2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMDI2MTQsImV4cCI6MjA4NjU3ODYxNH0.qaLYTfJQDz8Tp2WBqCLhKKaSs_lBSAvQ3W2h4v2L0xA';

// ---- Client Initialization ----
let _supabase = null;

function getSupabase() {
  if (_supabase) return _supabase;

  if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
    console.error('Supabase JS library not loaded. Add the CDN script tag.');
    return null;
  }

  _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _supabase;
}

// ---- Auth Helpers ----
const Auth = {
  async signUp(email, password, metadata) {
    var sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not initialized' } };

    var result = await sb.auth.signUp({
      email: email,
      password: password,
      options: {
        data: metadata || {},
        emailRedirectTo: window.location.origin + '/dashboard.html'
      }
    });
    return result;
  },

  async signIn(email, password) {
    var sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not initialized' } };

    return await sb.auth.signInWithPassword({ email: email, password: password });
  },

  async signInWithMagicLink(email) {
    var sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not initialized' } };

    return await sb.auth.signInWithOtp({
      email: email,
      options: { emailRedirectTo: window.location.origin + '/dashboard.html' }
    });
  },

  async signInWithGoogle() {
    var sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not initialized' } };

    return await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard.html',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
  },

  async signOut() {
    var sb = getSupabase();
    if (!sb) return;
    return await sb.auth.signOut();
  },

  async getSession() {
    var sb = getSupabase();
    if (!sb) return { data: { session: null } };
    return await sb.auth.getSession();
  },

  async getUser() {
    var sb = getSupabase();
    if (!sb) return { data: { user: null } };
    return await sb.auth.getUser();
  },

  async resetPassword(email) {
    var sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not initialized' } };

    return await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password.html'
    });
  },

  async updatePassword(newPassword) {
    var sb = getSupabase();
    if (!sb) return { error: { message: 'Supabase not initialized' } };

    return await sb.auth.updateUser({ password: newPassword });
  },

  onAuthStateChange(callback) {
    var sb = getSupabase();
    if (!sb) return { data: { subscription: { unsubscribe: function() {} } } };
    return sb.auth.onAuthStateChange(callback);
  }
};

// ---- Database Helpers ----
const DB = {
  // Profiles
  async getProfile(userId) {
    var sb = getSupabase();
    if (!sb) return { data: null, error: { message: 'Not initialized' } };

    return await sb
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
  },

  async upsertProfile(data) {
    var sb = getSupabase();
    if (!sb) return { error: { message: 'Not initialized' } };

    data.updated_at = new Date().toISOString();
    return await sb
      .from('profiles')
      .upsert(data, { onConflict: 'user_id' })
      .select()
      .single();
  },

  async updateProfile(userId, fields) {
    var sb = getSupabase();
    if (!sb) return { error: { message: 'Not initialized' } };

    fields.updated_at = new Date().toISOString();
    return await sb
      .from('profiles')
      .update(fields)
      .eq('user_id', userId)
      .select()
      .single();
  },

  // Experiences
  async getExperiences(profileId) {
    var sb = getSupabase();
    if (!sb) return { data: [], error: null };

    return await sb
      .from('experiences')
      .select('*')
      .eq('profile_id', profileId)
      .order('start_date', { ascending: false });
  },

  async upsertExperience(data) {
    var sb = getSupabase();
    if (!sb) return { error: { message: 'Not initialized' } };

    return await sb.from('experiences').upsert(data).select().single();
  },

  async deleteExperience(id) {
    var sb = getSupabase();
    if (!sb) return { error: { message: 'Not initialized' } };

    return await sb.from('experiences').delete().eq('id', id);
  },

  // Education
  async getEducation(profileId) {
    var sb = getSupabase();
    if (!sb) return { data: [], error: null };

    return await sb
      .from('education')
      .select('*')
      .eq('profile_id', profileId)
      .order('start_year', { ascending: false });
  },

  async upsertEducation(data) {
    var sb = getSupabase();
    if (!sb) return { error: { message: 'Not initialized' } };

    return await sb.from('education').upsert(data).select().single();
  },

  async deleteEducation(id) {
    var sb = getSupabase();
    if (!sb) return { error: { message: 'Not initialized' } };

    return await sb.from('education').delete().eq('id', id);
  },

  // Events / Analytics
  async trackEvent(eventType, metadata) {
    var sb = getSupabase();
    if (!sb) return;

    var session = await Auth.getSession();
    var userId = session.data.session ? session.data.session.user.id : null;
    var profileId = null;

    if (userId) {
      var profile = await this.getProfile(userId);
      if (profile.data) profileId = profile.data.id;
    }

    return await sb.from('events').insert({
      event_type: eventType,
      profile_id: profileId,
      metadata: metadata || {},
      source: localStorage.getItem('talent_utm') || localStorage.getItem('talent_ref') || 'direct',
      user_agent: navigator.userAgent
    });
  },

  // Public profile (by profile ID)
  async getPublicProfile(profileId) {
    var sb = getSupabase();
    if (!sb) return { data: null, error: { message: 'Not initialized' } };

    return await sb
      .from('profiles')
      .select('id, first_name, last_name, headline, summary, skills, sectors, experience_years, education_level, location, nationality, wants_to_relocate, photo_url, video_url, video_duration, availability, work_type, created_at')
      .eq('id', profileId)
      .eq('status', 'active')
      .single();
  },

  // Browse profiles with optional filters
  async browseProfiles(options) {
    var sb = getSupabase();
    if (!sb) return { data: [], error: null, count: 0 };

    options = options || {};
    var query = sb
      .from('profiles')
      .select('id, first_name, last_name, headline, skills, sectors, photo_url, video_url, location, availability, experience_years, created_at', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (options.sector) query = query.contains('sectors', [options.sector]);
    if (options.skill) query = query.contains('skills', [options.skill]);
    if (options.search) query = query.or('first_name.ilike.%' + options.search + '%,last_name.ilike.%' + options.search + '%,headline.ilike.%' + options.search + '%');
    if (options.availability) query = query.eq('availability', options.availability);
    if (options.has_video) query = query.not('video_url', 'is', null);

    var limit = options.limit || 24;
    var offset = options.offset || 0;
    query = query.range(offset, offset + limit - 1);

    return await query;
  },

  // Get experiences for a public profile
  async getPublicExperiences(profileId) {
    var sb = getSupabase();
    if (!sb) return { data: [], error: null };

    return await sb
      .from('experiences')
      .select('company, role, start_date, end_date, description, location, is_current')
      .eq('profile_id', profileId)
      .order('start_date', { ascending: false });
  },

  // Get education for a public profile
  async getPublicEducation(profileId) {
    var sb = getSupabase();
    if (!sb) return { data: [], error: null };

    return await sb
      .from('education')
      .select('institution, degree, field, start_year, end_year, location')
      .eq('profile_id', profileId)
      .order('start_year', { ascending: false });
  },

  // Waitlist
  async joinWaitlist(data) {
    var sb = getSupabase();
    if (!sb) return { error: { message: 'Not initialized' } };

    return await sb.from('waitlist').insert(data);
  }
};

// ---- Storage Helpers ----
const Storage = {
  async uploadFile(bucket, path, file, options) {
    var sb = getSupabase();
    if (!sb) return { error: { message: 'Not initialized' } };

    return await sb.storage.from(bucket).upload(path, file, options || {
      cacheControl: '3600',
      upsert: true
    });
  },

  getPublicUrl(bucket, path) {
    var sb = getSupabase();
    if (!sb) return '';

    var result = sb.storage.from(bucket).getPublicUrl(path);
    return result.data.publicUrl;
  },

  async uploadProfilePhoto(userId, file) {
    var ext = file.name.split('.').pop().toLowerCase();
    var path = userId + '/photo.' + ext;
    var result = await this.uploadFile('photos', path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type
    });
    if (result.error) return result;

    var url = this.getPublicUrl('photos', path);
    await DB.updateProfile(userId, { photo_url: url });
    return { data: { url: url }, error: null };
  },

  async uploadVideo(userId, blob) {
    var ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
    var path = userId + '/' + Date.now() + '.' + ext;
    var result = await this.uploadFile('videos', path, blob, {
      cacheControl: '3600',
      upsert: false,
      contentType: blob.type
    });
    if (result.error) return result;

    var url = this.getPublicUrl('videos', path);
    return { data: { url: url, path: path }, error: null };
  },

  async uploadResume(userId, file) {
    var path = userId + '/resume.pdf';
    var result = await this.uploadFile('resumes', path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'application/pdf'
    });
    if (result.error) return result;

    var url = this.getPublicUrl('resumes', path);
    await DB.updateProfile(userId, { resume_file_url: url });
    return { data: { url: url }, error: null };
  }
};
