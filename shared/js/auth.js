/**
 * SleepWell Studio — Firebase Auth Module
 * Shared authentication for CN & Global sites
 * 
 * Setup:
 * 1. Go to https://console.firebase.google.com
 * 2. Create project "sleepwell-studio"
 * 3. Enable Authentication → Email/Password + Google
 * 4. Register Web App, copy config below
 * 5. Add both site domains to Authorized Domains:
 *    - f2819174d58145dd84f657b89e7fde2d.app.codebuddy.work  (CN site)
 *    - lianglinyuan666-ai.github.io  (Global site)
 */

(function () {
  'use strict';

  // ===== FIREBASE CONFIG — Replace with your own =====
  const FIREBASE_CONFIG = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "000000000000",
    appId: "YOUR_APP_ID"
  };
  // ===================================================

  const STORAGE_KEY = 'sleepwell_auth';

  // Check if Firebase SDKs are loaded
  function isFirebaseAvailable() {
    return typeof firebase !== 'undefined' && firebase.auth;
  }

  // Load Firebase SDKs dynamically
  function loadFirebaseSDK() {
    return new Promise(function (resolve, reject) {
      if (isFirebaseAvailable()) { resolve(); return; }

      // Load Firebase App
      var appScript = document.createElement('script');
      appScript.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
      appScript.onload = function () {
        // Load Firebase Auth
        var authScript = document.createElement('script');
        authScript.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js';
        authScript.onload = function () {
          try {
            firebase.initializeApp(FIREBASE_CONFIG);
            resolve();
          } catch (e) {
            reject(e);
          }
        };
        authScript.onerror = reject;
        document.head.appendChild(authScript);
      };
      appScript.onerror = reject;
      document.head.appendChild(appScript);
    });
  }

  // ===== Auth State =====
  var _currentUser = null;
  var _authReady = false;
  var _listeners = [];

  function notifyListeners() {
    _listeners.forEach(function (fn) { try { fn(_currentUser); } catch (e) {} });
  }

  // ===== Public API =====
  window.SleepWellAuth = {
    /**
     * Initialize auth. Call once on page load.
     * @param {Function} [onUserChanged] - callback(currentUser|null)
     */
    init: function (onUserChanged) {
      if (onUserChanged) _listeners.push(onUserChanged);

      if (_authReady) {
        onUserChanged && onUserChanged(_currentUser);
        return;
      }

      loadFirebaseSDK().then(function () {
        firebase.auth().onAuthStateChanged(function (user) {
          _currentUser = user;
          _authReady = true;
          notifyListeners();
        });
      }).catch(function (err) {
        console.warn('Firebase Auth not configured. Login disabled.', err.message);
        _authReady = true;
        notifyListeners();
      });
    },

    /** Get current user (null if not logged in) */
    getUser: function () { return _currentUser; },

    /** Check if logged in */
    isLoggedIn: function () { return !!_currentUser; },

    /** Sign up with email + password */
    signUp: function (email, password) {
      return firebase.auth().createUserWithEmailAndPassword(email, password);
    },

    /** Sign in with email + password */
    signIn: function (email, password) {
      return firebase.auth().signInWithEmailAndPassword(email, password);
    },

    /** Sign in with Google */
    signInWithGoogle: function () {
      var provider = new firebase.auth.GoogleAuthProvider();
      return firebase.auth().signInWithPopup(provider);
    },

    /** Sign out */
    signOut: function () {
      return firebase.auth().signOut();
    },

    /** Send password reset email */
    resetPassword: function (email) {
      return firebase.auth().sendPasswordResetEmail(email);
    },

    /** Get display name */
    getDisplayName: function () {
      if (!_currentUser) return '';
      return _currentUser.displayName || _currentUser.email.split('@')[0] || 'Member';
    },

    /** Get avatar */
    getAvatar: function () {
      if (!_currentUser) return '';
      return _currentUser.photoURL || '';
    }
  };

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.SleepWellAuth.init();
    });
  } else {
    window.SleepWellAuth.init();
  }
})();
