/* ============================================
   Analytics & Tracking
   talent.stlucia.studio
   ============================================ */

var Analytics = (function() {

  // ---- Global Error Tracking ----
  function initErrorTracking() {
    window.addEventListener('error', function(e) {
      try {
        if (typeof DB === 'undefined' || !DB.trackEvent) return;
        DB.trackEvent('js_error', {
          message: e.message,
          filename: e.filename,
          line: e.lineno,
          col: e.colno,
          page: window.location.pathname
        });
      } catch (ignored) {}
    });

    window.addEventListener('unhandledrejection', function(e) {
      try {
        if (typeof DB === 'undefined' || !DB.trackEvent) return;
        DB.trackEvent('js_error', {
          message: e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled rejection',
          page: window.location.pathname
        });
      } catch (ignored) {}
    });
  }

  // ---- Page View Tracking ----
  function trackPageView() {
    try {
      if (typeof DB !== 'undefined' && DB.trackEvent) {
        DB.trackEvent('page_view', {
          page: window.location.pathname,
          referrer: document.referrer,
          ref: localStorage.getItem('talent_ref') || null,
          utm: localStorage.getItem('talent_utm') || null
        });
      }
    } catch (ignored) {}
  }

  // ---- Facebook Pixel Helper ----
  function fbTrack(event, params) {
    if (typeof fbq === 'function') {
      fbq('track', event, params || {});
    }
  }

  // ---- Plausible Custom Events ----
  function plausibleGoal(goalName, props) {
    if (typeof plausible === 'function') {
      plausible(goalName, { props: props || {} });
    }
  }

  // ---- Track Signup ----
  function trackSignup(method) {
    fbTrack('CompleteRegistration', { method: method });
    plausibleGoal('Signup', { method: method });
  }

  // ---- Track Video Record ----
  function trackVideoRecord(duration) {
    fbTrack('Lead', { content_name: 'video_resume' });
    plausibleGoal('VideoRecord', { duration: duration });
  }

  // ---- Track Profile Complete ----
  function trackProfileComplete(completeness) {
    fbTrack('ViewContent', { content_name: 'profile_complete', value: completeness });
    plausibleGoal('ProfileComplete', { score: completeness });
  }

  // ---- Init ----
  function init() {
    initErrorTracking();
    trackPageView();
  }

  return {
    init: init,
    fbTrack: fbTrack,
    plausibleGoal: plausibleGoal,
    trackSignup: trackSignup,
    trackVideoRecord: trackVideoRecord,
    trackProfileComplete: trackProfileComplete
  };
})();

// Auto-init
document.addEventListener('DOMContentLoaded', function() {
  Analytics.init();
});
