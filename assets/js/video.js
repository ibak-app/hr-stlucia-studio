/* ============================================
   Video Resume Recorder
   talent.stlucia.studio
   ============================================ */

var VideoRecorder = (function() {

  var stream = null;
  var mediaRecorder = null;
  var chunks = [];
  var recordedBlob = null;
  var timerInterval = null;
  var secondsElapsed = 0;
  var maxDuration = 90; // seconds
  var facingMode = 'user';

  var QUESTIONS = [
    "Tell us about yourself \u2014 who are you and what do you do?",
    "What are your top 3 skills and how have you used them?",
    "Why do you want to work in Saint Lucia?",
    "Describe a challenge you overcame at work.",
    "What kind of role are you looking for and why?"
  ];

  // ---- Elements ----
  var els = {};

  function getElements() {
    els.video = document.getElementById('camera-preview');
    els.playback = document.getElementById('video-playback');
    els.prompt = document.getElementById('video-prompt-text');
    els.timer = document.getElementById('timer-display');
    els.recordBtn = document.getElementById('record-btn');
    els.stopBtn = document.getElementById('stop-btn');
    els.retakeBtn = document.getElementById('retake-btn');
    els.submitBtn = document.getElementById('submit-btn');
    els.flipBtn = document.getElementById('flip-btn');
    els.uploadBtn = document.getElementById('upload-btn');
    els.uploadInput = document.getElementById('upload-input');
    els.questionBtns = document.querySelectorAll('[data-question]');
    els.previewScreen = document.getElementById('preview-screen');
    els.recordScreen = document.getElementById('record-screen');
    els.countdown = document.getElementById('countdown');
    els.permissionScreen = document.getElementById('permission-screen');
    els.errorScreen = document.getElementById('error-screen');
    els.errorMessage = document.getElementById('error-message');
  }

  // ---- Init ----
  function init() {
    getElements();
    bindEvents();
    setQuestion(0);
    requestCamera();
  }

  function bindEvents() {
    if (els.recordBtn) els.recordBtn.addEventListener('click', startCountdown);
    if (els.stopBtn) els.stopBtn.addEventListener('click', stopRecording);
    if (els.retakeBtn) els.retakeBtn.addEventListener('click', retake);
    if (els.submitBtn) els.submitBtn.addEventListener('click', submitVideo);
    if (els.flipBtn) els.flipBtn.addEventListener('click', flipCamera);

    if (els.uploadBtn) {
      els.uploadBtn.addEventListener('click', function() {
        els.uploadInput.click();
      });
    }

    if (els.uploadInput) {
      els.uploadInput.addEventListener('change', handleFileUpload);
    }

    els.questionBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(this.dataset.question);
        setQuestion(idx);
        els.questionBtns.forEach(function(b) { b.classList.remove('tag--selected'); });
        this.classList.add('tag--selected');
      });
    });
  }

  // ---- Camera ----
  async function requestCamera() {
    try {
      var constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      stream = await navigator.mediaDevices.getUserMedia(constraints);
      els.video.srcObject = stream;
      els.video.muted = true;
      await els.video.play();

      showScreen('record');
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showScreen('permission');
      } else {
        showError('Could not access camera: ' + err.message);
      }
    }
  }

  async function flipCamera() {
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    stopStream();
    await requestCamera();
  }

  function stopStream() {
    if (stream) {
      stream.getTracks().forEach(function(track) { track.stop(); });
      stream = null;
    }
  }

  // ---- Recording ----
  function startCountdown() {
    showElement(els.countdown);
    var count = 3;
    els.countdown.textContent = count;

    var interval = setInterval(function() {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        hideElement(els.countdown);
        startRecording();
      } else {
        els.countdown.textContent = count;
      }
    }, 1000);
  }

  function startRecording() {
    chunks = [];
    secondsElapsed = 0;

    // Determine supported MIME type
    var mimeType = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }
      }
    }

    var options = mimeType ? { mimeType: mimeType } : {};
    try {
      mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
      showError('Recording not supported on this device.');
      return;
    }

    mediaRecorder.ondataavailable = function(e) {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = function() {
      recordedBlob = new Blob(chunks, { type: mediaRecorder.mimeType || 'video/webm' });
      showPreview();
    };

    mediaRecorder.start(1000); // collect data every second

    // UI updates
    els.recordBtn.classList.add('hidden');
    showElement(els.stopBtn);
    els.timer.classList.add('recording');

    // Timer
    updateTimer();
    timerInterval = setInterval(function() {
      secondsElapsed++;
      updateTimer();

      if (secondsElapsed >= maxDuration) {
        stopRecording();
      }
    }, 1000);
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    clearInterval(timerInterval);
    els.stopBtn.classList.add('hidden');
    els.timer.classList.remove('recording');
  }

  function updateTimer() {
    var remaining = maxDuration - secondsElapsed;
    var mins = Math.floor(remaining / 60);
    var secs = remaining % 60;
    els.timer.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  // ---- Preview ----
  function showPreview() {
    if (!recordedBlob) return;

    var url = URL.createObjectURL(recordedBlob);
    els.playback.src = url;
    els.playback.muted = false;

    showScreen('preview');
    stopStream();
  }

  function retake() {
    recordedBlob = null;
    if (els.playback.src) {
      URL.revokeObjectURL(els.playback.src);
      els.playback.src = '';
    }
    secondsElapsed = 0;
    updateTimer();
    els.recordBtn.classList.remove('hidden');
    showScreen('record');
    requestCamera();
  }

  // ---- Upload ----
  function handleFileUpload() {
    var file = els.uploadInput.files[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('video/')) {
      App.showToast('Please select a video file.', 'error');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      App.showToast('Video must be under 100MB.', 'error');
      return;
    }

    recordedBlob = file;
    showPreview();
  }

  // ---- Submit ----
  async function submitVideo() {
    if (!recordedBlob) return;

    var user = App.getUser();
    if (!user) {
      App.showToast('Please log in first.', 'error');
      return;
    }

    App.setLoading(els.submitBtn, true);
    App.showToast('Uploading video...', 'info');

    var result = await Storage.uploadVideo(user.id, recordedBlob);

    if (result.error) {
      App.setLoading(els.submitBtn, false);
      App.showToast('Upload failed: ' + result.error.message, 'error');
      return;
    }

    // Update profile with video URL
    await DB.updateProfile(user.id, {
      video_url: result.data.url,
      video_duration: secondsElapsed || null
    });

    await DB.trackEvent('video_record', {
      duration: secondsElapsed,
      method: els.uploadInput.files.length > 0 ? 'upload' : 'record'
    });

    App.setLoading(els.submitBtn, false);
    App.showToast('Video resume saved!', 'success');

    setTimeout(function() {
      window.location.href = 'dashboard.html';
    }, 1500);
  }

  // ---- Questions ----
  function setQuestion(index) {
    if (els.prompt && QUESTIONS[index]) {
      els.prompt.textContent = QUESTIONS[index];
    }
  }

  // ---- Screen Management ----
  function showScreen(name) {
    if (els.recordScreen) els.recordScreen.classList.toggle('hidden', name !== 'record');
    if (els.previewScreen) els.previewScreen.classList.toggle('hidden', name !== 'preview');
    if (els.permissionScreen) els.permissionScreen.classList.toggle('hidden', name !== 'permission');
    if (els.errorScreen) els.errorScreen.classList.toggle('hidden', name !== 'error');
  }

  function showError(msg) {
    if (els.errorMessage) els.errorMessage.textContent = msg;
    showScreen('error');
  }

  function showElement(el) { if (el) el.classList.remove('hidden'); }
  function hideElement(el) { if (el) el.classList.add('hidden'); }

  // Cleanup on page leave
  window.addEventListener('beforeunload', function() {
    stopStream();
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  });

  return {
    init: init,
    QUESTIONS: QUESTIONS
  };
})();
