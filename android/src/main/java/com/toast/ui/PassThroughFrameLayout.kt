package com.toast.ui

import android.content.Context
import android.graphics.Rect
import android.view.MotionEvent
import android.view.View
import android.widget.FrameLayout

/**
 * FrameLayout that passes through touches outside the pill area so the
 * host activity still receives taps underneath the transparent overlay.
 */
class PassThroughFrameLayout(context: Context) : FrameLayout(context) {
    var pillView: View? = null

    /**
     * Tracks whether the in-flight gesture started on the pill. Once a DOWN
     * landed on the pill, every subsequent MOVE / UP / CANCEL of that gesture
     * must be forwarded — even if the finger moves outside the pill's (now
     * shrinking) bounds — otherwise the drag morph freezes and ACTION_UP
     * never fires.
     */
    private var isTrackingPillGesture = false
    private val pillRect = Rect()
    private val location = IntArray(2)

    override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
        val pill = pillView ?: return false

        when (ev.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                pill.getLocationOnScreen(location)
                pillRect.set(
                    location[0],
                    location[1],
                    location[0] + pill.width,
                    location[1] + pill.height
                )
                isTrackingPillGesture = pillRect.contains(ev.rawX.toInt(), ev.rawY.toInt())
                return if (isTrackingPillGesture) super.dispatchTouchEvent(ev) else false
            }
            MotionEvent.ACTION_MOVE -> {
                return if (isTrackingPillGesture) super.dispatchTouchEvent(ev) else false
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                val wasTracking = isTrackingPillGesture
                isTrackingPillGesture = false
                return if (wasTracking) super.dispatchTouchEvent(ev) else false
            }
        }
        return if (isTrackingPillGesture) super.dispatchTouchEvent(ev) else false
    }
}
