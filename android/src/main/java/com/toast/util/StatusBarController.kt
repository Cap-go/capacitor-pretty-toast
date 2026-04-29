package com.toast.util

import android.app.Activity
import android.view.WindowManager

/**
 * Toggles the legacy FULLSCREEN flag on the activity window. Used to hide
 * the status bar while a cutout-morph toast is visible so the pill can sit
 * flush against the camera hole without a competing status bar tint.
 */
object StatusBarController {
    @Suppress("DEPRECATION")
    fun hide(activity: Activity) {
        activity.window?.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )
    }

    @Suppress("DEPRECATION")
    fun show(activity: Activity) {
        activity.window?.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
    }
}
