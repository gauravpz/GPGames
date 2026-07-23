package com.example.spinverse

import android.annotation.SuppressLint
import android.app.Activity
import android.hardware.display.DisplayManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Display
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {

    private lateinit var controllerWebView: WebView
    private lateinit var displayManager: DisplayManager
    private lateinit var spinBridge: SpinBridge
    private var wheelPresentation: WheelPresentation? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        // Edge-to-edge layout for modern Android 15
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        )

        // JS bridge must be created before WebView so it's ready at load
        spinBridge = SpinBridge(this)

        controllerWebView = WebView(this)
        setContentView(controllerWebView)
        setupControllerWebView()

        // Watch for secondary displays (Miracast / WiFi Display to MiTV4L)
        displayManager = getSystemService(DISPLAY_SERVICE) as DisplayManager
        displayManager.registerDisplayListener(displayListener, mainHandler)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupControllerWebView() {
        controllerWebView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true          // localStorage
            allowFileAccess = true            // file:///android_asset
            allowContentAccess = true
            @Suppress("DEPRECATION")
            allowFileAccessFromFileURLs = true
            @Suppress("DEPRECATION")
            allowUniversalAccessFromFileURLs = true
            mediaPlaybackRequiresUserGesture = false   // auto-play audio
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            cacheMode = WebSettings.LOAD_DEFAULT
            loadsImagesAutomatically = true
        }

        // Add SpinBridge so phone web app can call window.MobileBridge.*
        controllerWebView.addJavascriptInterface(spinBridge, "MobileBridge")

        controllerWebView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String) {
                injectPhoneScript()
            }
        }
        controllerWebView.webChromeClient = WebChromeClient()
        controllerWebView.loadUrl("file:///android_asset/index.html")
    }

    /** Injects: viewport fix, touch highlight removal, Cast-to-TV button in the header */
    private fun injectPhoneScript() {
        val js = """
            (function() {
                var meta = document.querySelector('meta[name="viewport"]');
                if (!meta) { meta = document.createElement('meta'); meta.name='viewport'; document.head.appendChild(meta); }
                meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

                var style = document.createElement('style');
                style.textContent = 'body { -webkit-tap-highlight-color: transparent; touch-action: pan-y; }';
                document.head.appendChild(style);

                // Inject "📡 Cast to TV" button into header if not already there
                if (!document.getElementById('cast-tv-btn')) {
                    var headerActions = document.querySelector('.header-actions');
                    if (headerActions) {
                        var btn = document.createElement('button');
                        btn.id = 'cast-tv-btn';
                        btn.className = 'icon-btn';
                        btn.title = 'Cast wheels to TV via Miracast';
                        btn.innerHTML = '<span class="btn-icon">📡</span><span class="btn-text"> Cast to TV</span>';
                        btn.onclick = function() {
                            if (window.MobileBridge) window.MobileBridge.openCastSettings();
                        };
                        headerActions.prepend(btn);
                    }
                }
            })();
        """.trimIndent()
        controllerWebView.evaluateJavascript(js, null)
    }

    // ── Secondary display listener ────────────────────────────────────────
    private val displayListener = object : DisplayManager.DisplayListener {
        override fun onDisplayAdded(displayId: Int) {
            val d = displayManager.getDisplay(displayId) ?: return
            // Only act on presentation-capable displays (Miracast/WiFi Display)
            if (d.flags and Display.FLAG_PRESENTATION != 0) showPresentation(d)
        }
        override fun onDisplayRemoved(displayId: Int) {
            if (wheelPresentation?.display?.displayId == displayId) hidePresentation()
        }
        override fun onDisplayChanged(displayId: Int) {}
    }

    fun showPresentation(display: Display) {
        if (wheelPresentation != null) return
        val pres = WheelPresentation(this, display, spinBridge)
        pres.show()
        wheelPresentation = pres
        spinBridge.tvPresentation = pres

        // Switch phone to compact controller mode
        controllerWebView.post {
            controllerWebView.evaluateJavascript("window.activateCastControllerMode?.();", null)

            // Wait for TV WebView to finish loading, then sync config
            mainHandler.postDelayed({
                controllerWebView.evaluateJavascript(
                    """
                    JSON.stringify({
                        wheelConfigs: window.app?.wheelConfigs,
                        activeWheelCount: window.app?.activeWheelCount,
                        paperOptions: window.app?.paperGame?.options,
                        chairsOptions: window.app?.chairsGame?.options,
                        activeTab: document.getElementById('game-mode-wheels-btn')?.classList.contains('active') ? 'wheels' : (document.getElementById('game-mode-paper-btn')?.classList.contains('active') ? 'paper' : 'chairs')
                    })
                    """.trimIndent()
                ) { json ->
                    if (!json.isNullOrBlank() && json != "null") {
                        val cleaned = json.trim('"')
                            .replace("\\\"", "\"")
                            .replace("\\\\", "\\")
                        pres.syncConfig(cleaned)
                    }
                }
            }, 2500L)
        }
    }

    fun hidePresentation() {
        wheelPresentation?.dismiss()
        wheelPresentation = null
        spinBridge.tvPresentation = null
        controllerWebView.post {
            controllerWebView.evaluateJavascript("window.deactivateCastControllerMode?.();", null)
        }
    }

    override fun onResume() { super.onResume(); controllerWebView.onResume() }
    override fun onPause()  { super.onPause();  controllerWebView.onPause()  }

    override fun onDestroy() {
        displayManager.unregisterDisplayListener(displayListener)
        wheelPresentation?.dismiss()
        controllerWebView.destroy()
        super.onDestroy()
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN && event.keyCode == KeyEvent.KEYCODE_BACK) {
            if (wheelPresentation != null) { hidePresentation(); return true }
        }
        return super.dispatchKeyEvent(event)
    }
}
