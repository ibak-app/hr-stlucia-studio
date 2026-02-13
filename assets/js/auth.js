/* ============================================
   Auth Flows
   talent.stlucia.studio
   ============================================ */

var AuthUI = (function() {

  // ---- Signup ----
  async function handleSignup(email, password, metadata) {
    var result = await Auth.signUp(email, password, metadata);

    if (result.error) {
      return { success: false, message: result.error.message };
    }

    // Create initial profile
    if (result.data.user) {
      var profileData = {
        user_id: result.data.user.id,
        email: email,
        first_name: metadata.first_name || '',
        last_name: metadata.last_name || '',
        phone: metadata.phone || '',
        source: localStorage.getItem('talent_utm') || localStorage.getItem('talent_ref') || 'organic',
        referral_code: App.generateReferralCode()
      };

      await DB.upsertProfile(profileData);
      await DB.trackEvent('signup_complete', { method: 'email' });
    }

    return { success: true, user: result.data.user, session: result.data.session };
  }

  // ---- Login ----
  async function handleLogin(email, password) {
    var result = await Auth.signIn(email, password);

    if (result.error) {
      var msg = result.error.message;
      if (msg.includes('Invalid login')) msg = 'Invalid email or password. Please try again.';
      return { success: false, message: msg };
    }

    await DB.trackEvent('login', { method: 'email' });
    return { success: true, user: result.data.user, session: result.data.session };
  }

  // ---- Magic Link ----
  async function handleMagicLink(email) {
    var result = await Auth.signInWithMagicLink(email);

    if (result.error) {
      return { success: false, message: result.error.message };
    }

    return { success: true, message: 'Check your email for a login link.' };
  }

  // ---- Logout ----
  async function handleLogout() {
    await Auth.signOut();
    window.location.href = 'index.html';
  }

  // ---- Signup Form Binding (multi-step) ----
  function initSignupForm() {
    var form = document.getElementById('signup-form');
    if (!form) return;

    var steps = form.querySelectorAll('.signup-step');
    var totalSteps = steps.length;
    var currentStep = 0;
    var formData = {};

    // Password visibility toggle
    var toggleBtns = form.querySelectorAll('.toggle-password');
    toggleBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var input = this.parentElement.querySelector('input');
        var isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        this.textContent = isPassword ? 'Hide' : 'Show';
      });
    });

    function showStep(index) {
      steps.forEach(function(step, i) {
        step.classList.toggle('hidden', i !== index);
      });
      currentStep = index;
      updateProgress(index, totalSteps);
      updateStepDots(index);
    }

    function updateProgress(current, total) {
      var bar = document.querySelector('.progress__bar');
      if (bar) {
        bar.style.width = ((current + 1) / total * 100) + '%';
      }
      var label = document.querySelector('.step-label');
      if (label) {
        label.textContent = 'Step ' + (current + 1) + ' of ' + total;
      }
    }

    function updateStepDots(current) {
      var dots = document.querySelectorAll('.step');
      dots.forEach(function(dot, i) {
        dot.classList.remove('step--active', 'step--done');
        if (i < current) dot.classList.add('step--done');
        if (i === current) dot.classList.add('step--active');
      });
    }

    // Next step
    form.querySelectorAll('[data-next]').forEach(function(btn) {
      btn.addEventListener('click', async function(e) {
        e.preventDefault();
        var step = steps[currentStep];
        var inputs = step.querySelectorAll('input[required], select[required], textarea[required]');
        var valid = true;
        inputs.forEach(function(input) {
          if (!App.validateField(input)) valid = false;
        });

        if (!valid) return;

        // Collect data from current step
        var stepData = App.getFormData(step);
        Object.assign(formData, stepData);

        // Step 1: create account
        if (currentStep === 0) {
          App.setLoading(btn, true);

          var result = await handleSignup(
            formData.email,
            formData.password,
            {
              first_name: formData.first_name,
              last_name: formData.last_name,
              phone: formData.phone
            }
          );

          App.setLoading(btn, false);

          if (!result.success) {
            App.showToast(result.message, 'error');
            return;
          }

          App.showToast('Account created!', 'success');
        }

        // Step 2: save skills & sector
        if (currentStep === 1) {
          App.setLoading(btn, true);

          var user = App.getUser();
          if (user) {
            var skills = getSelectedTags('skills-tags');
            var sectors = getSelectedTags('sector-tags');

            await DB.updateProfile(user.id, {
              headline: formData.headline || '',
              skills: skills,
              sectors: sectors,
              experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
              education_level: formData.education_level || null
            });
          }

          App.setLoading(btn, false);
        }

        showStep(currentStep + 1);
      });
    });

    // Previous step
    form.querySelectorAll('[data-prev]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        if (currentStep > 0) showStep(currentStep - 1);
      });
    });

    // Final submit (Step 3: summary)
    var finalBtn = form.querySelector('[data-finish]');
    if (finalBtn) {
      finalBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        App.setLoading(finalBtn, true);

        var user = App.getUser();
        if (user) {
          var summary = form.querySelector('[name="summary"]');
          await DB.updateProfile(user.id, {
            summary: summary ? summary.value.trim() : ''
          });
          await DB.trackEvent('profile_complete', { step: 'summary' });
        }

        App.setLoading(finalBtn, false);
        window.location.href = 'success.html';
      });
    }

    // Init first step
    showStep(0);

    // Real-time validation
    form.querySelectorAll('input, select, textarea').forEach(function(input) {
      input.addEventListener('blur', function() {
        App.validateField(this);
      });
      input.addEventListener('input', function() {
        var group = this.closest('.form-group');
        if (group && group.classList.contains('form-group--error')) {
          App.validateField(this);
        }
      });
    });
  }

  // ---- Tag Selection Helper ----
  function getSelectedTags(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return [];
    var selected = container.querySelectorAll('.tag--selected');
    return Array.from(selected).map(function(tag) {
      return tag.dataset.value;
    });
  }

  function initTagSelector(containerId, options) {
    var container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    options.forEach(function(opt) {
      var tag = document.createElement('button');
      tag.type = 'button';
      tag.className = 'tag';
      tag.dataset.value = opt;
      tag.textContent = opt;
      tag.addEventListener('click', function() {
        this.classList.toggle('tag--selected');
      });
      container.appendChild(tag);
    });
  }

  // ---- Login Form Binding ----
  function initLoginForm() {
    var form = document.getElementById('login-form');
    if (!form) return;

    var emailTab = document.getElementById('tab-email');
    var magicTab = document.getElementById('tab-magic');
    var passwordGroup = document.getElementById('password-group');
    var submitBtn = form.querySelector('button[type="submit"]');
    var mode = 'email';

    if (emailTab) {
      emailTab.addEventListener('click', function() {
        mode = 'email';
        emailTab.classList.add('btn--primary');
        emailTab.classList.remove('btn--ghost');
        if (magicTab) {
          magicTab.classList.add('btn--ghost');
          magicTab.classList.remove('btn--primary');
        }
        if (passwordGroup) passwordGroup.classList.remove('hidden');
        if (submitBtn) submitBtn.textContent = 'Log In';
      });
    }

    if (magicTab) {
      magicTab.addEventListener('click', function() {
        mode = 'magic';
        magicTab.classList.add('btn--primary');
        magicTab.classList.remove('btn--ghost');
        if (emailTab) {
          emailTab.classList.add('btn--ghost');
          emailTab.classList.remove('btn--primary');
        }
        if (passwordGroup) passwordGroup.classList.add('hidden');
        if (submitBtn) submitBtn.textContent = 'Send Magic Link';
      });
    }

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (!App.validateForm(form)) return;

      var data = App.getFormData(form);
      App.setLoading(submitBtn, true);

      if (mode === 'magic') {
        var result = await handleMagicLink(data.email);
        App.setLoading(submitBtn, false);
        if (result.success) {
          App.showToast(result.message, 'success');
        } else {
          App.showToast(result.message, 'error');
        }
      } else {
        var result = await handleLogin(data.email, data.password);
        App.setLoading(submitBtn, false);
        if (result.success) {
          var redirect = App.getUrlParam('redirect') || 'dashboard.html';
          window.location.href = redirect;
        } else {
          App.showToast(result.message, 'error');
        }
      }
    });

    // Toggle password
    var toggleBtns = form.querySelectorAll('.toggle-password');
    toggleBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var input = this.parentElement.querySelector('input');
        var isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        this.textContent = isPassword ? 'Hide' : 'Show';
      });
    });
  }

  // ---- Public API ----
  return {
    initSignupForm: initSignupForm,
    initLoginForm: initLoginForm,
    initTagSelector: initTagSelector,
    getSelectedTags: getSelectedTags,
    handleLogout: handleLogout,
    handleSignup: handleSignup,
    handleLogin: handleLogin
  };
})();
