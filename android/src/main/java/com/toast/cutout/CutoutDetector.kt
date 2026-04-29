package com.toast.cutout

import android.app.Activity
import android.graphics.Rect
import android.os.Build
import android.view.RoundedCorner
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.toast.util.ToastConstants.COLLAPSED_CUTOUT_FACTOR

/**
 * Reads DisplayCutout + rounded-corner insets off the decor view and
 * packages them into an immutable [CutoutInfo] snapshot.
 */
object CutoutDetector {

    fun detect(activity: Activity, decorView: View, useDynamicIsland: Boolean): CutoutInfo {
        val screenWidth = activity.resources.displayMetrics.widthPixels
        val density = activity.resources.displayMetrics.density
        val insets = ViewCompat.getRootWindowInsets(decorView)

        val statusBarHeight = resolveStatusBarHeight(activity, insets)
        val screenCornerRadius = resolveScreenCornerRadius(decorView)

        val cutoutRect = if (useDynamicIsland) {
            detectTopCutoutRect(decorView, statusBarHeight)
        } else {
            null
        }

        val hasCutout = cutoutRect != null

        val collapsedWidth: Float
        val collapsedHeight: Float
        val horizontalOffset: Float
        if (cutoutRect != null) {
            collapsedWidth = cutoutRect.width() * COLLAPSED_CUTOUT_FACTOR
            collapsedHeight = cutoutRect.height() * COLLAPSED_CUTOUT_FACTOR
            val screenCenterX = screenWidth / 2f
            horizontalOffset = cutoutRect.centerX() - screenCenterX
        } else {
            collapsedWidth = 120f * density
            collapsedHeight = 36f * density
            horizontalOffset = 0f
        }

        return CutoutInfo(
            hasCutout = hasCutout,
            rect = cutoutRect,
            collapsedWidth = collapsedWidth,
            collapsedHeight = collapsedHeight,
            horizontalOffset = horizontalOffset,
            screenCornerRadius = screenCornerRadius,
            statusBarHeight = statusBarHeight,
        )
    }

    private fun detectTopCutoutRect(decorView: View, statusBarHeight: Int): Rect? {
        val insets = ViewCompat.getRootWindowInsets(decorView) ?: return null
        val cutout = insets.displayCutout ?: return null

        // Enable Dynamic-Island-style behavior for any top cutout —
        // centered punch-hole, corner camera, or notch. The morph
        // animation uses horizontal translation so it lands correctly
        // on off-center holes.
        val topRect = cutout.boundingRects.firstOrNull { it.top == 0 || it.top < statusBarHeight }
        return topRect?.takeIf { !it.isEmpty }
    }

    private fun resolveStatusBarHeight(activity: Activity, insets: WindowInsetsCompat?): Int {
        val fromInsets = insets?.getInsets(WindowInsetsCompat.Type.statusBars())?.top ?: 0
        if (fromInsets > 0) return fromInsets
        val resourceId = activity.resources.getIdentifier("status_bar_height", "dimen", "android")
        return if (resourceId > 0) activity.resources.getDimensionPixelSize(resourceId) else 0
    }

    private fun resolveScreenCornerRadius(decorView: View): Int {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val insets = decorView.rootWindowInsets
            val topLeft = insets?.getRoundedCorner(RoundedCorner.POSITION_TOP_LEFT)
            val topRight = insets?.getRoundedCorner(RoundedCorner.POSITION_TOP_RIGHT)
            val radius = maxOf(topLeft?.radius ?: 0, topRight?.radius ?: 0)
            if (radius > 0) return radius
        }
        return 0
    }
}
