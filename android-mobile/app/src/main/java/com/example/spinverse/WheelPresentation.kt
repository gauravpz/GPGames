package com.example.spinverse

import android.annotation.SuppressLint
import android.app.Presentation
import android.content.Context
import android.os.Bundle
import android.view.Display
import android.view.View
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * Presentation window shown on the MiTV4L (secondary display via Miracast).
 * Displays the spinner wheels fullscreen at 1080p.
 * Controlled remotely by the phone via SpinBridge.
 */
class WheelPresentation(
    context: Context,
    display: Display,
    private val spinBridge: SpinBridge
) : Presentation(context, display) {

    lateinit var tvWebView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Force fullscreen on TV display
        window?.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
        window?.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        @Suppress("DEPRECATION")
        window?.decorView?.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN
            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        )

        tvWebView = WebView(context)
        setContentView(tvWebView)

        tvWebView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            @Suppress("DEPRECATION")
            allowFileAccessFromFileURLs = true
            @Suppress("DEPRECATION")
            allowUniversalAccessFromFileURLs = true
            mediaPlaybackRequiresUserGesture = false
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            cacheMode = WebSettings.LOAD_DEFAULT
            loadsImagesAutomatically = true
        }

        tvWebView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String) {
                injectTVScript()
            }
        }
        tvWebView.webChromeClient = WebChromeClient()
        tvWebView.loadUrl("file:///android_asset/index.html")

        // Give bridge a reference to this presentation's WebView
        spinBridge.tvPresentation = this
    }

    /**
     * Injected into TV WebView after page loads:
     * - Activates TV mode (fullscreen wheels, no config UI)
     * - Sets viewport for 1080p
     * - Disables Google Fonts CDN (offline)
     */
    private fun injectTVScript() {
        val js = """
            (function() {
                // 1080p viewport for TV
                var meta = document.querySelector('meta[name="viewport"]');
                if (!meta) { meta = document.createElement('meta'); meta.name='viewport'; document.head.appendChild(meta); }
                meta.content = 'width=1920, initial-scale=1.0, user-scalable=no';

                // System font fallback (Google Fonts CDN offline)
                try {
                    var gfLink = document.querySelector('link[href*="fonts.googleapis"]');
                    if (gfLink) gfLink.remove();
                    var fs = document.createElement('style');
                    fs.textContent = ':root { --font-family: "Roboto", system-ui, -apple-system, sans-serif !important; }';
                    document.head.appendChild(fs);
                } catch(e) {}

                // Activate TV mode: fullscreen, no config panels, no scrolling
                document.body.classList.add('tv-mode');
                document.body.style.overflow = 'hidden';
                document.documentElement.style.overflow = 'hidden';
                document.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

                // Resize wheels to fill new layout
                setTimeout(function() {
                    if (window.app && window.app.wheels) {
                        window.app.wheels.forEach(function(w) { if (w.resize) w.resize(); });
                    }
                }, 300);

                console.log('[SpinVerse Cast] TV presentation ready at 1080p');
            })();
        """.trimIndent()
        tvWebView.post { tvWebView.evaluateJavascript(js, null) }
    }

    /** Triggered by SpinBridge when phone user taps SPIN */
    fun spinNow(targetsJson: String? = null) {
        tvWebView.post {
            if (!targetsJson.isNullOrBlank()) {
                val escaped = targetsJson
                    .replace("\\", "\\\\")
                    .replace("'", "\\'")
                tvWebView.evaluateJavascript("window.spinNow?.('$escaped');", null)
            } else {
                tvWebView.evaluateJavascript("window.spinNow?.();", null)
            }
        }
    }

    /**
     * Sync wheel configuration from phone to TV.
     * @param json raw JSON string with wheelConfigs + activeWheelCount
     */
    fun syncConfig(json: String) {
        tvWebView.post {
            val escaped = json
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\r", "")
            tvWebView.evaluateJavascript("window.applyConfig('$escaped');", null)
        }
    }

    /** Sync tab switch from phone to TV */
    fun switchTab(tabName: String) {
        tvWebView.post {
            val escaped = tabName.replace("'", "\\'")
            tvWebView.evaluateJavascript("window.switchTab?.('$escaped');", null)
        }
    }

    /** Trigger paper game fan on TV with target index */
    fun triggerPaperAction(chosenIndex: Int) {
        tvWebView.post {
            tvWebView.evaluateJavascript("window.triggerPaperAction?.($chosenIndex);", null)
        }
    }

    /** Sync paper game names/options to TV */
    fun syncPaperConfig(json: String) {
        tvWebView.post {
            val escaped = json
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\r", "")
            tvWebView.evaluateJavascript("window.syncPaperConfig?.('$escaped');", null)
        }
    }

    /** Trigger musical chairs game action (start, freeze, next, reset) on TV */
    fun triggerChairsAction(json: String) {
        tvWebView.post {
            val escaped = json
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\r", "")
            tvWebView.evaluateJavascript("window.triggerChairsAction?.('$escaped');", null)
        }
    }

    /** Sync musical chairs players/options to TV */
    fun syncChairsConfig(json: String) {
        tvWebView.post {
            val escaped = json
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\r", "")
            tvWebView.evaluateJavascript("window.syncChairsConfig?.('$escaped');", null)
        }
    }
}
