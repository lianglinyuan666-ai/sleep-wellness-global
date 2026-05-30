/**
 * SleepWell Studio — Auth UI Module
 * Login/Signup modal, nav button integration
 */

(function () {
  'use strict';

  // ===== Create Auth Modal HTML =====
  function createAuthModal() {
    var modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'auth-modal-overlay';
    modal.innerHTML = [
      '<div class="auth-modal">',
      '  <button class="auth-close" onclick="document.getElementById(\'authModal\').classList.remove(\'active\')">&times;</button>',
      '  <div class="auth-tabs">',
      '    <button class="auth-tab active" data-tab="login">Sign In</button>',
      '    <button class="auth-tab" data-tab="signup">Sign Up</button>',
      '  </div>',

      '  <!-- Login Form -->',
      '  <form class="auth-form active" data-form="login" onsubmit="return false;">',
      '    <div class="auth-social">',
      '      <button type="button" class="auth-google-btn" onclick="AuthUI.googleSignIn()">',
      '        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>',
      '        Continue with Google',
      '      </button>',
      '    </div>',
      '    <div class="auth-divider"><span>or with email</span></div>',
      '    <label class="auth-label">Email</label>',
      '    <input type="email" class="auth-input" id="loginEmail" placeholder="your@email.com" autocomplete="email">',
      '    <label class="auth-label">Password</label>',
      '    <input type="password" class="auth-input" id="loginPassword" placeholder="••••••••" autocomplete="current-password">',
      '    <div class="auth-error" id="loginError"></div>',
      '    <button type="submit" class="auth-submit" onclick="AuthUI.emailSignIn()">Sign In</button>',
      '    <button type="button" class="auth-forgot" onclick="AuthUI.forgotPassword()">Forgot password?</button>',
      '  </form>',

      '  <!-- Signup Form -->',
      '  <form class="auth-form" data-form="signup" onsubmit="return false;">',
      '    <div class="auth-social">',
      '      <button type="button" class="auth-google-btn" onclick="AuthUI.googleSignIn()">',
      '        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>',
      '        Continue with Google',
      '      </button>',
      '    </div>',
      '    <div class="auth-divider"><span>or with email</span></div>',
      '    <label class="auth-label">Display Name</label>',
      '    <input type="text" class="auth-input" id="signupName" placeholder="Your name" autocomplete="name">',
      '    <label class="auth-label">Email</label>',
      '    <input type="email" class="auth-input" id="signupEmail" placeholder="your@email.com" autocomplete="email">',
      '    <label class="auth-label">Password (min 6 characters)</label>',
      '    <input type="password" class="auth-input" id="signupPassword" placeholder="••••••••" autocomplete="new-password">',
      '    <div class="auth-error" id="signupError"></div>',
      '    <button type="submit" class="auth-submit" onclick="AuthUI.emailSignUp()">Create Account</button>',
      '    <p class="auth-terms">By signing up, you agree to our <a href="privacy.html">Privacy Policy</a> and <a href="disclaimer.html">Disclaimer</a>.</p>',
      '  </form>',
      '</div>',
    ].join('\n');

    document.body.appendChild(modal);

    // Tab switching
    modal.querySelectorAll('.auth-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = this.dataset.tab;
        modal.querySelectorAll('.auth-tab').forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        modal.querySelectorAll('.auth-form').forEach(function (f) {
          f.classList.toggle('active', f.dataset.form === target);
        });
        // Clear errors
        modal.querySelectorAll('.auth-error').forEach(function (e) { e.textContent = ''; });
      });
    });

    // Close on overlay click
    modal.addEventListener('click', function (e) {
      if (e.target === modal) modal.classList.remove('active');
    });

    // Enter key submits
    modal.querySelectorAll('.auth-input').forEach(function (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          var form = this.closest('.auth-form');
          if (form.dataset.form === 'login') { AuthUI.emailSignIn(); }
          else { AuthUI.emailSignUp(); }
        }
      });
    });
  }

  // ===== CSS Styles =====
  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '.auth-modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center; backdrop-filter: blur(4px); }',
      '.auth-modal-overlay.active { display: flex; }',
      '.auth-modal { background: var(--clr-cream, #FFF); border-radius: 16px; padding: 2rem; width: 90%; max-width: 420px; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }',
      '.auth-close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--clr-text-muted, #999); line-height: 1; }',
      '.auth-close:hover { color: var(--clr-night, #000); }',
      '.auth-tabs { display: flex; margin-bottom: 1.5rem; border-bottom: 2px solid var(--clr-sand, #E8E0D0); }',
      '.auth-tab { flex: 1; padding: 0.75rem; border: none; background: none; font-size: 0.95rem; font-weight: 600; color: var(--clr-text-muted, #999); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s; }',
      '.auth-tab.active { color: var(--clr-sage-deep, #4A6741); border-bottom-color: var(--clr-sage, #9BAF9B); }',
      '.auth-form { display: none; }',
      '.auth-form.active { display: block; }',
      '.auth-social { margin-bottom: 1rem; }',
      '.auth-google-btn { width: 100%; padding: 0.75rem; border: 2px solid #E0E0E0; border-radius: 10px; background: #fff; font-size: 0.9rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.75rem; transition: all 0.2s; }',
      '.auth-google-btn:hover { background: #F5F5F5; border-color: #CCC; }',
      '.auth-divider { display: flex; align-items: center; margin: 1rem 0; color: var(--clr-text-muted, #999); font-size: 0.78rem; }',
      '.auth-divider::before, .auth-divider::after { content: ""; flex: 1; border-bottom: 1px solid var(--clr-sand, #E8E0D0); }',
      '.auth-divider span { padding: 0 0.75rem; }',
      '.auth-label { display: block; font-size: 0.82rem; font-weight: 600; color: var(--clr-night, #333); margin-bottom: 0.25rem; margin-top: 0.75rem; }',
      '.auth-input { width: 100%; padding: 0.7rem 0.85rem; border: 2px solid var(--clr-sand, #E8E0D0); border-radius: 10px; font-size: 0.9rem; background: #FAFAFA; transition: border-color 0.2s; box-sizing: border-box; }',
      '.auth-input:focus { outline: none; border-color: var(--clr-sage, #9BAF9B); background: #fff; }',
      '.auth-error { color: #D32F2F; font-size: 0.78rem; margin-top: 0.5rem; min-height: 1.2em; }',
      '.auth-submit { width: 100%; padding: 0.8rem; background: var(--clr-night, #1A1A1A); color: #fff; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; margin-top: 0.75rem; transition: background 0.2s; }',
      '.auth-submit:hover { background: var(--clr-sage-deep, #4A6741); }',
      '.auth-forgot { display: block; width: 100%; text-align: center; background: none; border: none; color: var(--clr-text-muted, #999); font-size: 0.8rem; cursor: pointer; margin-top: 0.75rem; text-decoration: underline; }',
      '.auth-forgot:hover { color: var(--clr-sage-deep, #4A6741); }',
      '.auth-terms { font-size: 0.72rem; color: var(--clr-text-muted, #999); text-align: center; margin-top: 0.75rem; line-height: 1.5; }',
      '.auth-terms a { color: var(--clr-sage-deep, #4A6741); }',

      /* Nav user menu */
      '.nav-user-btn { display: flex; align-items: center; gap: 0.5rem; background: var(--clr-bg-section, #F5F2EE); border: none; padding: 0.35rem 0.75rem; border-radius: var(--radius-pill, 20px); cursor: pointer; font-size: 0.78rem; font-weight: 500; color: var(--clr-night, #333); transition: all 0.2s; }',
      '.nav-user-btn:hover { background: var(--clr-sand, #E8E0D0); }',
      '.nav-user-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--clr-sage, #9BAF9B); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.75rem; font-weight: 700; overflow: hidden; }',
      '.nav-user-avatar img { width: 100%; height: 100%; object-fit: cover; }',
      '.nav-user-dropdown { position: absolute; top: 100%; right: 0; margin-top: 0.5rem; background: #fff; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); padding: 0.5rem 0; min-width: 180px; z-index: 9999; display: none; }',
      '.nav-user-dropdown.active { display: block; }',
      '.nav-user-dropdown-item { display: block; width: 100%; padding: 0.6rem 1rem; border: none; background: none; text-align: left; font-size: 0.82rem; cursor: pointer; color: var(--clr-night, #333); transition: background 0.15s; }',
      '.nav-user-dropdown-item:hover { background: var(--clr-bg-section, #F5F2EE); }',
      '.nav-user-dropdown-item.danger { color: #D32F2F; }',
      '.nav-user-wrap { position: relative; }',
    ].join('\n');
    document.head.appendChild(style);
  }

  // ===== UI Controller =====
  window.AuthUI = {
    showLogin: function () {
      var modal = document.getElementById('authModal');
      if (!modal) { createAuthModal(); modal = document.getElementById('authModal'); injectStyles(); }
      modal.classList.add('active');
      // Default to login tab
      modal.querySelector('[data-tab="login"]').click();
    },

    showSignup: function () {
      var modal = document.getElementById('authModal');
      if (!modal) { createAuthModal(); modal = document.getElementById('authModal'); injectStyles(); }
      modal.classList.add('active');
      // Switch to signup tab
      modal.querySelector('[data-tab="signup"]').click();
    },

    // Email sign in
    emailSignIn: function () {
      var email = document.getElementById('loginEmail').value.trim();
      var password = document.getElementById('loginPassword').value;
      var errorEl = document.getElementById('loginError');

      if (!email || !password) { errorEl.textContent = 'Please fill in all fields.'; return; }

      errorEl.textContent = '';
      window.SleepWellAuth.signIn(email, password).then(function () {
        document.getElementById('authModal').classList.remove('active');
      }).catch(function (err) {
        errorEl.textContent = AuthUI._mapError(err.code);
      });
    },

    // Email sign up
    emailSignUp: function () {
      var name = document.getElementById('signupName').value.trim();
      var email = document.getElementById('signupEmail').value.trim();
      var password = document.getElementById('signupPassword').value;
      var errorEl = document.getElementById('signupError');

      if (!email || !password) { errorEl.textContent = 'Please fill in all required fields.'; return; }
      if (password.length < 6) { errorEl.textContent = 'Password must be at least 6 characters.'; return; }

      errorEl.textContent = '';
      window.SleepWellAuth.signUp(email, password).then(function (result) {
        // Update profile with display name if provided
        if (name && result.user) {
          result.user.updateProfile({ displayName: name }).then(function () {
            document.getElementById('authModal').classList.remove('active');
          });
        } else {
          document.getElementById('authModal').classList.remove('active');
        }
      }).catch(function (err) {
        errorEl.textContent = AuthUI._mapError(err.code);
      });
    },

    // Google sign in
    googleSignIn: function () {
      window.SleepWellAuth.signInWithGoogle().then(function () {
        document.getElementById('authModal').classList.remove('active');
      }).catch(function (err) {
        if (err.code !== 'auth/popup-closed-by-user') {
          var errorEl = document.querySelector('.auth-form.active .auth-error');
          if (errorEl) errorEl.textContent = AuthUI._mapError(err.code);
        }
      });
    },

    // Sign out
    signOut: function () {
      window.SleepWellAuth.signOut().then(function () {
        var dropdown = document.querySelector('.nav-user-dropdown');
        if (dropdown) dropdown.classList.remove('active');
      });
    },

    // Forgot password
    forgotPassword: function () {
      var email = document.getElementById('loginEmail').value.trim() || prompt('Enter your email address to reset password:');
      if (!email) return;
      window.SleepWellAuth.resetPassword(email).then(function () {
        alert('Password reset link sent! Check your email.');
      }).catch(function (err) {
        document.getElementById('loginError').textContent = AuthUI._mapError(err.code);
      });
    },

    // Update nav button
    updateNavButton: function (user) {
      var navActions = document.querySelector('.nav-actions');
      if (!navActions) return;

      // Remove existing login/user buttons
      var existingLogin = navActions.querySelector('#navLoginBtn');
      var existingUser = navActions.querySelector('.nav-user-wrap');
      if (existingLogin) existingLogin.remove();
      if (existingUser) existingUser.remove();

      if (user) {
        // Logged in — show user menu
        var avatar = user.photoURL
          ? '<img src="' + user.photoURL + '" alt="">'
          : (user.displayName || user.email || 'U').charAt(0).toUpperCase();
        var displayName = user.displayName || user.email.split('@')[0] || 'Member';

        var userWrap = document.createElement('div');
        userWrap.className = 'nav-user-wrap';
        userWrap.innerHTML = [
          '<button class="nav-user-btn" id="navUserBtn">',
          '  <span class="nav-user-avatar">' + avatar + '</span>',
          '  <span>' + displayName + '</span>',
          '</button>',
          '<div class="nav-user-dropdown" id="navUserDropdown">',
          '  <div class="nav-user-dropdown-item" style="font-size:0.72rem;color:var(--clr-text-muted);border-bottom:1px solid var(--clr-sand);padding-bottom:0.5rem;margin-bottom:0.25rem;">' + (user.email || '') + '</div>',
          '  <a class="nav-user-dropdown-item" href="index.html">🏠 Home</a>',
          '  <button class="nav-user-dropdown-item danger" onclick="AuthUI.signOut()">🚪 Sign Out</button>',
          '</div>',
        ].join('\n');

        navActions.appendChild(userWrap);

        // Toggle dropdown
        document.getElementById('navUserBtn').addEventListener('click', function (e) {
          e.stopPropagation();
          document.getElementById('navUserDropdown').classList.toggle('active');
        });

        // Close on outside click
        document.addEventListener('click', function () {
          var dd = document.getElementById('navUserDropdown');
          if (dd) dd.classList.remove('active');
        });
      } else {
        // Not logged in — show login button
        var loginBtn = document.createElement('button');
        loginBtn.id = 'navLoginBtn';
        loginBtn.style.cssText = 'background:var(--clr-sage);color:#fff;border:none;padding:0.4rem 1rem;border-radius:var(--radius-pill);font-size:0.78rem;font-weight:600;cursor:pointer;';
        loginBtn.textContent = 'Login';
        loginBtn.addEventListener('click', function (e) { e.preventDefault(); AuthUI.showLogin(); });
        navActions.appendChild(loginBtn);
      }
    },

    // Map Firebase error codes to readable messages
    _mapError: function (code) {
      var map = {
        'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/user-not-found': 'No account found with this email. Sign up first.',
        'auth/wrong-password': 'Incorrect password. Try again or reset it.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/popup-closed-by-user': 'Sign-in cancelled.',
        'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/configuration-not-found': 'Login service is being set up. Check back soon.',
      };
      return map[code] || 'Something went wrong. Please try again. (' + code + ')';
    }
  };

  // ===== Auto-hook =====
  document.addEventListener('DOMContentLoaded', function () {
    // Wait for SleepWellAuth to initialize
    var checkInterval = setInterval(function () {
      if (window.SleepWellAuth && window.SleepWellAuth.getUser !== undefined) {
        clearInterval(checkInterval);
        window.SleepWellAuth.init(AuthUI.updateNavButton);
        injectStyles();
        createAuthModal();
      }
    }, 100);

    // Stop checking after 5 seconds
    setTimeout(function () { clearInterval(checkInterval); }, 5000);
  });
})();
