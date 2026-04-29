package com.toast.anim

import android.animation.ValueAnimator
import android.graphics.drawable.GradientDrawable
import android.view.View
import android.widget.LinearLayout
import com.toast.cutout.CutoutInfo
import com.toast.util.Density
import com.toast.util.ToastConstants.MORPH_DURATION_MS
import com.toast.util.ToastConstants.MORPH_EASING

/**
 * Dynamic-Island-style morph animation. The pill scales + translates
 * between the expanded capsule and a tight footprint over the cutout,
 * while cornerRadii morph so the on-screen corner stays circular
 * throughout the anisotropic scale.
 */
class CutoutMorphAnimator(
    private val pill: LinearLayout,
    private val content: View,
    private val info: CutoutInfo,
    private val expandedCornerRadius: Float,
    private val density: Density,
    private val onBeforeShow: () -> Unit = {},
    private val onBeforeDismiss: () -> Unit = {},
) : ToastAnimator {

    private var cornerAnimator: ValueAnimator? = null
    private val cornerRadiiBuf = FloatArray(8)

    /**
     * Lower bound for the measured pill height — guards against racing
     * the layout pass, where `pill.height` can briefly read as 0.
     */
    private val heightFloor: Float get() = density.dp(70f)

    private fun expandedHeight(): Float = pill.height.toFloat().coerceAtLeast(heightFloor)

    override fun show() {
        onBeforeShow()

        val expandedWidth = pill.layoutParams.width.toFloat()
        val scaleX = info.collapsedWidth / expandedWidth
        val scaleY = info.collapsedHeight / expandedHeight()

        pill.pivotX = expandedWidth / 2f
        pill.pivotY = 0f
        pill.scaleX = scaleX
        pill.scaleY = scaleY
        // Translate so the collapsed pill starts centered over the cutout
        // (zero offset for centered holes, non-zero for corner cameras).
        pill.translationX = info.horizontalOffset
        pill.translationY = 0f
        pill.alpha = 1f
        content.alpha = 0f
        // Start with fully-capsule corners so the initial frame reads as a
        // pill hugging the camera, not a tiny rectangle.
        applyMorphCorners(1f)

        // Material standard ease-in-out — gentle accel, soft landing.
        // Duration matches iOS's `.bouncy(duration: 0.3)`.
        pill.animate()
            .scaleX(1f)
            .scaleY(1f)
            .translationX(0f)
            .setDuration(MORPH_DURATION_MS)
            .setInterpolator(MORPH_EASING)
            .start()
        animateMorphCorners(fromProgress = 1f, toProgress = 0f, durationMs = MORPH_DURATION_MS)

        content.animate()
            .alpha(1f)
            .setDuration(210)
            .setStartDelay(80)
            .start()
    }

    override fun dismiss(onEnd: () -> Unit) {
        onBeforeDismiss()

        val expandedWidth = pill.width.toFloat().coerceAtLeast(1f)
        val expandedHeight = expandedHeight()
        val scaleX = info.collapsedWidth / expandedWidth
        val scaleY = info.collapsedHeight / expandedHeight

        // Clear any stale drag translation and align pivots with show()
        // so the morph collapses exactly onto the cutout.
        pill.translationY = 0f
        pill.pivotX = expandedWidth / 2f
        pill.pivotY = 0f

        content.animate()
            .alpha(0f)
            .setDuration(140)
            .start()

        // Infer current progress from pill.scaleY so the corner animation
        // picks up from wherever the drag left it.
        val minScaleY = info.collapsedHeight / expandedHeight
        val currentProgress = if (minScaleY < 1f)
            ((1f - pill.scaleY) / (1f - minScaleY)).coerceIn(0f, 1f)
        else 0f

        // Scale down and fade out simultaneously — no two-step pop.
        pill.animate()
            .scaleX(scaleX)
            .scaleY(scaleY)
            .translationX(info.horizontalOffset)
            .alpha(0f)
            .setDuration(MORPH_DURATION_MS)
            .setInterpolator(MORPH_EASING)
            .withEndAction {
                resetPillToExpandedResting()
                onEnd()
            }
            .start()
        animateMorphCorners(fromProgress = currentProgress, toProgress = 1f, durationMs = MORPH_DURATION_MS)
    }

    override fun applyDrag(dy: Float, translationYOnDown: Float) {
        if (dy >= 0f) return // drag morph is upward-only
        applyDragMorph(-dy)
    }

    override fun snapBack() {
        // Release-without-dismiss during a morph drag: spring back to full
        // size and restore content opacity.
        pill.animate().cancel()
        pill.animate()
            .scaleX(1f)
            .scaleY(1f)
            .translationX(0f)
            .setDuration(MORPH_DURATION_MS)
            .setInterpolator(MORPH_EASING)
            .start()

        val minScaleY = info.collapsedHeight / expandedHeight()
        val currentProgress = if (minScaleY < 1f)
            ((1f - pill.scaleY) / (1f - minScaleY)).coerceIn(0f, 1f)
        else 0f
        animateMorphCorners(currentProgress, 0f, MORPH_DURATION_MS)

        content.animate().cancel()
        content.animate()
            .alpha(1f)
            .setDuration(220)
            .start()
    }

    /**
     * Interpolates the pill's scale from fully expanded toward the cutout
     * footprint. `upwardDistance` is positive px of finger travel up.
     */
    private fun applyDragMorph(upwardDistance: Float) {
        val expandedWidth = pill.width.toFloat().coerceAtLeast(1f)
        val expandedHeight = expandedHeight()
        val collapsedScaleX = info.collapsedWidth / expandedWidth
        val collapsedScaleY = info.collapsedHeight / expandedHeight

        val fullCollapseDistance = density.dp(140f)
        val progress = (upwardDistance / fullCollapseDistance).coerceIn(0f, 1f)

        pill.pivotX = expandedWidth / 2f
        pill.pivotY = 0f
        pill.scaleX = 1f - progress * (1f - collapsedScaleX)
        pill.scaleY = 1f - progress * (1f - collapsedScaleY)
        pill.translationX = info.horizontalOffset * progress

        cornerAnimator?.cancel()
        applyMorphCorners(progress)
        // Fade content out quickly in the first half so the morph reads
        // as a shape change, not text squeezing.
        content.alpha = (1f - progress * 2f).coerceIn(0f, 1f)
    }

    /**
     * Sets cornerRadii so the visually-rendered corners stay circular
     * throughout the anisotropic scale. With a single cornerRadius,
     * non-uniform scale turns corners into squished ellipses — we
     * compensate by feeding pre-scale x/y radii that project to the
     * desired visible radius after scaleX/scaleY.
     *
     * progress: 0 = fully expanded, 1 = fully collapsed to cutout.
     */
    private fun applyMorphCorners(progress: Float) {
        val bg = pill.background as? GradientDrawable ?: return
        val pillW = pill.layoutParams.width.toFloat().coerceAtLeast(1f)
        val pillH = expandedHeight()
        val scaleX = 1f - progress * (1f - info.collapsedWidth / pillW)
        val scaleY = 1f - progress * (1f - info.collapsedHeight / pillH)

        val collapsedCap = minOf(info.collapsedWidth, info.collapsedHeight) / 2f
        val visibleCap = expandedCornerRadius + (collapsedCap - expandedCornerRadius) * progress

        val rx = visibleCap / scaleX
        val ry = visibleCap / scaleY
        // Reuse the buffer — applyMorphCorners runs per-frame during drag.
        cornerRadiiBuf[0] = rx; cornerRadiiBuf[1] = ry
        cornerRadiiBuf[2] = rx; cornerRadiiBuf[3] = ry
        cornerRadiiBuf[4] = rx; cornerRadiiBuf[5] = ry
        cornerRadiiBuf[6] = rx; cornerRadiiBuf[7] = ry
        bg.cornerRadii = cornerRadiiBuf
    }

    /**
     * Drives `applyMorphCorners` in lockstep with the scale/translation
     * animation — same duration + interpolator so the two stay in sync
     * frame-for-frame.
     */
    private fun animateMorphCorners(fromProgress: Float, toProgress: Float, durationMs: Long) {
        cornerAnimator?.cancel()
        cornerAnimator = ValueAnimator.ofFloat(fromProgress, toProgress).apply {
            duration = durationMs
            interpolator = MORPH_EASING
            addUpdateListener { applyMorphCorners(it.animatedValue as Float) }
            start()
        }
    }

    private fun resetPillToExpandedResting() {
        pill.scaleX = 1f
        pill.scaleY = 1f
        pill.translationX = 0f
        pill.alpha = 1f
        content.alpha = 1f
        (pill.background as? GradientDrawable)?.apply {
            cornerRadii = null
            cornerRadius = expandedCornerRadius
        }
    }

    fun cancelPendingCallbacks() {
        cornerAnimator?.cancel()
    }
}
