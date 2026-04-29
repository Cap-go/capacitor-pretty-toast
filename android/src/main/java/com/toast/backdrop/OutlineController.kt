package com.toast.backdrop

import android.animation.ArgbEvaluator
import android.animation.ValueAnimator
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.animation.AccelerateDecelerateInterpolator

/**
 * Drives the outline colour on the toast pill's [GradientDrawable] stroke.
 *
 * Mirrors the iOS renderer in `PrettyToastView.swift`: on `.colored` tint the
 * stroke takes the toast's accent at 20% alpha; on `.gray` it falls back to a
 * near-invisible white at 6%. Tint changes crossfade over 300 ms via a
 * `ValueAnimator` + `ArgbEvaluator`, matching the iOS
 * `.animation(.easeInOut(duration: 0.3))` on stroke opacity.
 */
class OutlineController(
    private val pillBackground: GradientDrawable,
    private val strokeWidthPx: Int,
) {
    private var accentColor: Int = Color.WHITE
    private var currentTint: BackdropTint = BackdropTint.GRAY
    private var currentStrokeColor: Int = Color.TRANSPARENT
    private var animator: ValueAnimator? = null
    /**
     * When non-null, overrides the sampler-driven stroke with a fixed color.
     * Used by the JS-facing `strokeColor` prop; treated as the full ARGB
     * value (alpha included — no further opacity derivation).
     */
    private var override: Int? = null

    init {
        applyStroke(strokeColorFor(currentTint))
    }

    fun setAccent(accent: Int) {
        if (accent == accentColor) return
        accentColor = accent
        val target = strokeColorFor(currentTint)
        animator?.cancel()
        applyStroke(target)
    }

    fun setTint(tint: BackdropTint, animated: Boolean) {
        if (tint == currentTint) return
        currentTint = tint
        if (override != null) return
        val target = strokeColorFor(tint)
        if (!animated) {
            animator?.cancel()
            applyStroke(target)
            return
        }
        animateStrokeTo(target)
    }

    fun setOverride(color: Int?) {
        if (override == color) return
        override = color
        animator?.cancel()
        applyStroke(color ?: strokeColorFor(currentTint))
    }

    private fun strokeColorFor(tint: BackdropTint): Int = override ?: when (tint) {
        BackdropTint.COLORED -> withAlpha(accentColor, ACCENT_ALPHA_255)
        BackdropTint.GRAY -> withAlpha(Color.WHITE, GRAY_ALPHA_255)
    }

    private fun withAlpha(color: Int, alpha: Int): Int =
        (color and 0x00FFFFFF) or ((alpha and 0xFF) shl 24)

    private fun applyStroke(color: Int) {
        currentStrokeColor = color
        pillBackground.setStroke(strokeWidthPx, color)
    }

    private fun animateStrokeTo(target: Int) {
        animator?.cancel()
        val start = currentStrokeColor
        animator = ValueAnimator.ofObject(ArgbEvaluator(), start, target).apply {
            duration = CROSSFADE_MS
            interpolator = AccelerateDecelerateInterpolator()
            addUpdateListener { a -> applyStroke(a.animatedValue as Int) }
            start()
        }
    }

    fun cancel() {
        animator?.cancel()
        animator = null
    }

    companion object {
        // 0.20 × 255 = 51, 0.06 × 255 ≈ 15 — match iOS stroke alphas.
        private const val ACCENT_ALPHA_255 = 51
        private const val GRAY_ALPHA_255 = 15
        private const val CROSSFADE_MS = 300L
    }
}
