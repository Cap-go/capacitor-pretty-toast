package com.toast.gesture

import android.view.MotionEvent
import android.widget.LinearLayout
import com.toast.anim.ToastAnimator
import com.toast.util.Density
import kotlin.math.abs

/**
 * Installs an OnTouchListener on the pill that routes drag updates to
 * the active [ToastAnimator] and decides between dismiss / tap / snap-back
 * on release.
 *
 * Thresholds:
 * - Any upward drag > 15dp → dismiss.
 * - Finger movement ≤ 8dp in both axes → tap (`onPress`).
 * - Anything else → snap-back.
 */
class ToastGestureHandler(
    private val animator: ToastAnimator,
    private val density: Density,
    private val enableSwipeDismiss: Boolean,
    private val onDismissRequested: () -> Unit,
    private val onPress: () -> Unit,
) {
    private var touchStartX = 0f
    private var touchStartY = 0f
    private var pillTranslationYOnDown = 0f

    fun install(pill: LinearLayout) {
        pill.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    touchStartX = event.rawX
                    touchStartY = event.rawY
                    pillTranslationYOnDown = pill.translationY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    if (enableSwipeDismiss) {
                        val dy = event.rawY - touchStartY
                        animator.applyDrag(dy, pillTranslationYOnDown)
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    val dy = event.rawY - touchStartY
                    val dx = event.rawX - touchStartX

                    if (enableSwipeDismiss && dy < -density.dp(15f)) {
                        onDismissRequested()
                    } else if (abs(dy) < density.dp(8f) && abs(dx) < density.dp(8f)) {
                        onPress()
                        animator.snapBack()
                    } else {
                        animator.snapBack()
                    }
                    true
                }
                MotionEvent.ACTION_CANCEL -> {
                    animator.snapBack()
                    true
                }
                else -> false
            }
        }
    }
}
