package com.example.spinverse

import android.app.Activity
import android.content.Intent
import android.provider.Settings
import android.webkit.JavascriptInterface

/**
 * JavaScript bridge added to the phone's controller WebView (window.MobileBridge).
 *
 * Phone web app calls these methods to:
 *  - Trigger a spin on the TV
 *  - Sync wheel config changes to TV
 *  - Open Android Cast/Screen Mirror settings
 */
class SpinBridge(private val activity: Activity) {

    /** Set when a TV presentation is active; cleared when cast ends */
    @Volatile
    var tvPresentation: WheelPresentation? = null

    // ── Called from phone web app ──────────────────────────────────────────

    /** Fires when user taps SPIN on the phone — mirrors to TV wheels */
    @JavascriptInterface
    fun onSpin() {
        tvPresentation?.spinNow(null)
    }

    @JavascriptInterface
    fun onSpin(targetsJson: String) {
        tvPresentation?.spinNow(targetsJson)
    }

    /**
     * Fires when wheel config changes on phone (title / options edit).
     * @param json JSON string: { wheelConfigs: [...], activeWheelCount: N }
     */
    @JavascriptInterface
    fun onConfigUpdate(json: String) {
        tvPresentation?.syncConfig(json)
    }

    /** Fires when user switches Arcade Tab on phone (wheels, paper, chairs) */
    @JavascriptInterface
    fun onTabChange(tabName: String) {
        tvPresentation?.switchTab(tabName)
    }

    /** Fires when paper game fan is triggered on phone */
    @JavascriptInterface
    fun onPaperAction(chosenIndex: Int) {
        tvPresentation?.triggerPaperAction(chosenIndex)
    }

    /** Fires when paper game options are updated on phone */
    @JavascriptInterface
    fun onPaperConfigUpdate(json: String) {
        tvPresentation?.syncPaperConfig(json)
    }

    /** Fires when musical chairs game action (start/freeze/next/reset) occurs on phone */
    @JavascriptInterface
    fun onChairsAction(json: String) {
        tvPresentation?.triggerChairsAction(json)
    }

    /** Fires when musical chairs players/options are updated on phone */
    @JavascriptInterface
    fun onChairsConfigUpdate(json: String) {
        tvPresentation?.syncChairsConfig(json)
    }

    /**
     * Opens Android system Cast / Screen Mirror settings so user can
     * connect the phone to MiTV4L via Miracast / WiFi Display.
     */
    @JavascriptInterface
    fun openCastSettings() {
        activity.runOnUiThread {
            val intents = listOf(
                "android.settings.CAST_SETTINGS",          // Stock Android cast
                "com.miui.settings.MiuiSmartHomeActivity", // MIUI Smart Home
            )
            var launched = false
            for (action in intents) {
                try {
                    activity.startActivity(Intent(action)); launched = true; break
                } catch (_: Exception) {}
            }
            if (!launched) {
                try { activity.startActivity(Intent(Settings.ACTION_WIRELESS_SETTINGS)) }
                catch (_: Exception) { activity.startActivity(Intent(Settings.ACTION_SETTINGS)) }
            }
        }
    }

    /** Returns true if a TV presentation is currently active */
    @get:JavascriptInterface
    val isCasting: Boolean
        get() = tvPresentation != null
}
