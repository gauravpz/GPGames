package com.example.spinversetv

import android.annotation.SuppressLint
import android.app.Activity
import android.app.AlertDialog
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Go truly fullscreen — hide system bars and status bar
        window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        val decorView = window.decorView
        decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        )

        webView = WebView(this)
        setContentView(webView)

        // ── WebView Settings ──────────────────────────────────────────
        val settings: WebSettings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true         // localStorage support
        settings.allowFileAccess = true           // load from file:///android_asset
        settings.allowContentAccess = true
        @Suppress("DEPRECATION")
        settings.allowFileAccessFromFileURLs = true
        @Suppress("DEPRECATION")
        settings.allowUniversalAccessFromFileURLs = true
        settings.mediaPlaybackRequiresUserGesture = false  // auto-play audio
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.loadsImagesAutomatically = true
        settings.setSupportZoom(false)
        settings.builtInZoomControls = false
        settings.displayZoomControls = false
        settings.setGeolocationEnabled(false)

        // ── Clients ───────────────────────────────────────────────────
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                // Auto-activate TV Mode after page loads
                injectTVModeScript()
            }
        }
        webView.webChromeClient = WebChromeClient()

        // ── JS Bridge for back-button dialog ──────────────────────────
        webView.addJavascriptInterface(TVBridge(), "TVBridge")

        // ── Load the app from assets ──────────────────────────────────
        webView.loadUrl("file:///android_asset/index.html")
    }

    /**
     * Inject JS that:
     * 1. Confirms the TVBridge object is available (helps activateTVSetup() detect WebView)
     * 2. Maps D-pad navigation keys — DPAD_CENTER (Enter) → Space to spin
     * 3. Locks overflow/scroll so TV layout never scrolls
     * 4. Fixes viewport and uses system fonts (Google Fonts CDN unavailable offline)
     */
    private fun injectTVModeScript() {
        val js = """
            (function() {
                // ── 1. Ensure font falls back gracefully (CDN unavailable offline) ─
                try {
                    var existingFont = document.querySelector('link[href*="fonts.googleapis"]');
                    if (existingFont) existingFont.remove();
                    // Override CSS font to use system sans-serif
                    var styleEl = document.createElement('style');
                    styleEl.textContent = ':root { --font-family: "Roboto", system-ui, -apple-system, sans-serif !important; }';
                    document.head.appendChild(styleEl);
                } catch(e) {}

                // ── 2. D-pad remote key handler ─────────────────────────────────
                // Android TV remote: Enter/DPAD_CENTER → keyCode 13
                // The app's activateTVSetup() detects window.TVBridge, shows the
                // setup overlay automatically. After "Start Spinning" is tapped,
                // this handler fires Space to spin the wheels.
                document.addEventListener('keydown', function(e) {
                    if (e.keyCode === 13 || e.keyCode === 10) {
                        // If setup overlay is visible, let Enter click the focused element
                        var overlay = document.getElementById('tv-setup-overlay');
                        var overlayVisible = overlay && overlay.style.display !== 'none';
                        if (overlayVisible) {
                            // Let default Enter behavior work (click focused button, etc.)
                            return;
                        }
                        // Otherwise → SPIN
                        var spaceEvent = new KeyboardEvent('keydown', {
                            key: ' ', code: 'Space', keyCode: 32,
                            which: 32, bubbles: true, cancelable: true
                        });
                        document.dispatchEvent(spaceEvent);
                        e.preventDefault();
                    }
                }, true);

                // ── 3. Prevent scroll rubber-banding after TV mode activates ────
                // (body.tv-mode CSS already blocks it, but belt-and-suspenders)
                document.addEventListener('touchmove', function(e) {
                    e.preventDefault();
                }, { passive: false });

                // ── 4. Fix viewport for 1080p TV ────────────────────────────────
                var meta = document.querySelector('meta[name="viewport"]');
                if (!meta) {
                    meta = document.createElement('meta');
                    meta.name = 'viewport';
                    document.head.appendChild(meta);
                }
                meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

                console.log('[SpinVerse TV] WebView injection complete — setup overlay auto-shows.');
            })();
        """.trimIndent()

        webView.evaluateJavascript(js, null)
    }


    // ── D-pad / Remote key events ─────────────────────────────────────────
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN) {
            when (event.keyCode) {
                KeyEvent.KEYCODE_DPAD_CENTER,
                KeyEvent.KEYCODE_ENTER -> {
                    // Let WebView handle — our injected JS converts Enter → Space
                    return super.dispatchKeyEvent(event)
                }
                KeyEvent.KEYCODE_BACK -> {
                    showExitDialog()
                    return true
                }
                KeyEvent.KEYCODE_DPAD_UP,
                KeyEvent.KEYCODE_DPAD_DOWN,
                KeyEvent.KEYCODE_DPAD_LEFT,
                KeyEvent.KEYCODE_DPAD_RIGHT -> {
                    return super.dispatchKeyEvent(event)
                }
                KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
                KeyEvent.KEYCODE_MEDIA_PLAY -> {
                    // Play/Pause also triggers spin
                    webView.evaluateJavascript(
                        "document.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space',keyCode:32,which:32,bubbles:true}));",
                        null
                    )
                    return true
                }
            }
        }
        return super.dispatchKeyEvent(event)
    }

    private fun showExitDialog() {
        AlertDialog.Builder(this)
            .setTitle("Exit SpinVerse TV?")
            .setMessage("Are you sure you want to exit?")
            .setPositiveButton("Exit") { _, _ -> finish() }
            .setNegativeButton("Stay") { dialog, _ -> dialog.dismiss() }
            .setCancelable(true)
            .show()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        webView.stopLoading()
        webView.destroy()
        super.onDestroy()
    }

    /** JavaScript bridge for native TV features */
    inner class TVBridge {
        @JavascriptInterface
        fun exitApp() {
            runOnUiThread { showExitDialog() }
        }
    }
}
