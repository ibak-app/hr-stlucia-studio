/* ============================================
   Core App Logic
   talent.stlucia.studio
   ============================================ */

var App = (function() {

  // ---- Auth State ----
  var currentUser = null;
  var currentProfile = null;
  var authReady = false;
  var authCallbacks = [];

  // ---- Init ----
  function init() {
    initNavScroll();
    registerServiceWorker();
    checkAuth();
  }

  // ---- Service Worker ----
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(function() {
        // SW registration failed — likely local dev without HTTPS
      });
    }
  }

  // ---- Auth Check ----
  async function checkAuth() {
    var result = await Auth.getSession();
    var session = result.data.session;

    if (session) {
      currentUser = session.user;
      await loadProfile();
    }

    authReady = true;
    authCallbacks.forEach(function(cb) { cb(currentUser, currentProfile); });
    authCallbacks = [];

    updateNavForAuth();

    // Listen for changes
    Auth.onAuthStateChange(function(event, session) {
      if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        loadProfile().then(function() { updateNavForAuth(); });
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentProfile = null;
        updateNavForAuth();
      }
    });
  }

  function onAuthReady(callback) {
    if (authReady) {
      callback(currentUser, currentProfile);
    } else {
      authCallbacks.push(callback);
    }
  }

  async function loadProfile() {
    if (!currentUser) return;
    var result = await DB.getProfile(currentUser.id);
    if (result.data) {
      currentProfile = result.data;
    }
  }

  function requireAuth(redirectTo) {
    onAuthReady(function(user) {
      if (!user) {
        var dest = redirectTo || window.location.pathname;
        window.location.href = 'login.html?redirect=' + encodeURIComponent(dest);
      }
    });
  }

  function getUser() { return currentUser; }
  function getProfile() { return currentProfile; }

  // ---- Nav Auth State ----
  function updateNavForAuth() {
    var navLinks = document.querySelector('.nav__links');
    var navCta = document.querySelector('.nav__cta');
    if (!navLinks || !navCta) return;

    if (currentUser) {
      // Update login link to dashboard
      var loginLink = navLinks.querySelector('a[href="login.html"]');
      if (loginLink) {
        loginLink.textContent = 'Dashboard';
        loginLink.href = 'dashboard.html';
      }

      // Update CTA
      navCta.innerHTML = '<a href="dashboard.html" class="btn btn--primary btn--sm">Dashboard</a>';
    }
  }

  // ---- Nav Scroll ----
  function initNavScroll() {
    var nav = document.getElementById('nav');
    if (!nav) return;

    var scrolled = false;
    window.addEventListener('scroll', function() {
      if (window.scrollY > 20 && !scrolled) {
        nav.classList.add('nav--scrolled');
        scrolled = true;
      } else if (window.scrollY <= 20 && scrolled) {
        nav.classList.remove('nav--scrolled');
        scrolled = false;
      }
    }, { passive: true });
  }

  // ---- Form Helpers ----
  function getFormData(form) {
    var data = {};
    var inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(function(input) {
      if (!input.name) return;
      if (input.type === 'checkbox') {
        data[input.name] = input.checked;
      } else if (input.type === 'radio') {
        if (input.checked) data[input.name] = input.value;
      } else {
        data[input.name] = input.value.trim();
      }
    });
    return data;
  }

  function setFormData(form, data) {
    Object.keys(data).forEach(function(key) {
      var input = form.querySelector('[name="' + key + '"]');
      if (!input) return;
      if (input.type === 'checkbox') {
        input.checked = !!data[key];
      } else if (input.type === 'radio') {
        var radio = form.querySelector('[name="' + key + '"][value="' + data[key] + '"]');
        if (radio) radio.checked = true;
      } else {
        input.value = data[key] || '';
      }
    });
  }

  function validateField(input) {
    var group = input.closest('.form-group');
    if (!group) return true;

    var isValid = input.checkValidity();
    if (!isValid) {
      group.classList.add('form-group--error');
      var errorEl = group.querySelector('.form-error');
      if (errorEl) {
        errorEl.textContent = input.validationMessage;
        errorEl.style.display = 'block';
      }
    } else {
      group.classList.remove('form-group--error');
      var errorEl = group.querySelector('.form-error');
      if (errorEl) errorEl.style.display = 'none';
    }
    return isValid;
  }

  function validateForm(form) {
    var inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    var allValid = true;
    inputs.forEach(function(input) {
      if (!validateField(input)) allValid = false;
    });
    return allValid;
  }

  // ---- Profile Completeness ----
  function calculateCompleteness(profile) {
    if (!profile) return 0;
    var fields = [
      { key: 'first_name', weight: 10 },
      { key: 'last_name', weight: 10 },
      { key: 'email', weight: 10 },
      { key: 'phone', weight: 5 },
      { key: 'headline', weight: 10 },
      { key: 'summary', weight: 15 },
      { key: 'skills', weight: 10, isArray: true },
      { key: 'sectors', weight: 5, isArray: true },
      { key: 'experience_years', weight: 5 },
      { key: 'education_level', weight: 5 },
      { key: 'video_url', weight: 10 },
      { key: 'photo_url', weight: 5 }
    ];

    var score = 0;
    fields.forEach(function(f) {
      var val = profile[f.key];
      if (f.isArray) {
        if (val && val.length > 0) score += f.weight;
      } else {
        if (val && val !== '') score += f.weight;
      }
    });

    return Math.min(100, score);
  }

  // ---- Toast / Notifications ----
  function showToast(message, type) {
    type = type || 'info';
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = '<span>' + escapeHtml(message) + '</span>';

    // Styles
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%) translateY(20px)',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '9999',
      opacity: '0',
      transition: 'all 0.3s ease',
      maxWidth: '90vw',
      textAlign: 'center'
    });

    var colors = {
      success: { bg: '#06D6A0', color: '#fff' },
      error: { bg: '#EF476F', color: '#fff' },
      info: { bg: '#0D7377', color: '#fff' },
      warning: { bg: '#FFD166', color: '#1A202C' }
    };

    var c = colors[type] || colors.info;
    toast.style.background = c.bg;
    toast.style.color = c.color;

    document.body.appendChild(toast);

    requestAnimationFrame(function() {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(function() { toast.remove(); }, 300);
    }, 3500);
  }

  // ---- Button Loading State ----
  function setLoading(btn, loading) {
    if (loading) {
      btn.dataset.originalText = btn.textContent;
      btn.classList.add('btn--loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('btn--loading');
      btn.disabled = false;
      if (btn.dataset.originalText) {
        btn.textContent = btn.dataset.originalText;
      }
    }
  }

  // ---- Utilities ----
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  }

  function generateReferralCode() {
    return 'TL' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  function getUrlParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  // ---- Skill Tags ----
  var COMMON_SKILLS = [
    'Customer Service', 'Microsoft Office', 'Management', 'Communication',
    'Teamwork', 'Sales', 'Accounting', 'Cooking', 'Hospitality',
    'Driving', 'Construction', 'Plumbing', 'Electrical', 'Nursing',
    'Teaching', 'IT Support', 'Web Development', 'Marketing',
    'Photography', 'Event Planning', 'Security', 'Agriculture',
    'Fishing', 'Tour Guide', 'Bartending', 'Housekeeping',
    'Front Desk', 'Data Entry', 'Social Media', 'Project Management'
  ];

  var SECTORS = [
    'Tourism & Hospitality', 'Finance & Banking', 'Technology',
    'Healthcare', 'Education', 'Construction', 'Agriculture',
    'Government', 'Retail & Sales', 'Creative & Media',
    'Maritime', 'Transportation'
  ];

  var EDUCATION_LEVELS = [
    { value: 'high_school', label: 'High School / CXC' },
    { value: 'vocational', label: 'Vocational / Trade Certificate' },
    { value: 'associate', label: 'Associate Degree' },
    { value: 'bachelor', label: "Bachelor's Degree" },
    { value: 'master', label: "Master's Degree" },
    { value: 'phd', label: 'Doctorate / PhD' }
  ];

  var AVAILABILITY_OPTIONS = [
    { value: 'immediate', label: 'Immediately' },
    { value: '2_weeks', label: 'Within 2 weeks' },
    { value: '1_month', label: 'Within 1 month' },
    { value: '3_months', label: 'Within 3 months' }
  ];

  var WORK_TYPES = [
    { value: 'full_time', label: 'Full-time' },
    { value: 'part_time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  // ---- Public API ----
  return {
    init: init,
    onAuthReady: onAuthReady,
    requireAuth: requireAuth,
    getUser: getUser,
    getProfile: getProfile,
    loadProfile: loadProfile,
    getFormData: getFormData,
    setFormData: setFormData,
    validateField: validateField,
    validateForm: validateForm,
    calculateCompleteness: calculateCompleteness,
    showToast: showToast,
    setLoading: setLoading,
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    generateReferralCode: generateReferralCode,
    getUrlParam: getUrlParam,
    COMMON_SKILLS: COMMON_SKILLS,
    SECTORS: SECTORS,
    EDUCATION_LEVELS: EDUCATION_LEVELS,
    AVAILABILITY_OPTIONS: AVAILABILITY_OPTIONS,
    WORK_TYPES: WORK_TYPES
  };
})();

// Auto-init when DOM ready
document.addEventListener('DOMContentLoaded', function() {
  App.init();
});
