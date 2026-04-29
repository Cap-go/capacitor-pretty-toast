package com.toast.util

import android.view.animation.PathInterpolator

/**
 * Shared animation/morph constants for the toast overlay.
 */
object ToastConstants {
    /**
     * Material standard "emphasized" ease-in-out: gentle start, quick
     * mid-phase, soft landing. Feels closer to iOS's .bouncy curve than
     * the default decelerate/accelerate interpolators.
     */
    val MORPH_EASING = PathInterpolator(0.2f, 0f, 0f, 1f)

    /**
     * Android's DisplayCutout.boundingRect is the *reserved* safe-area
     * around the camera — on most phones 1.5–2× the visible punch hole.
     * Shrinking by this factor produces a pill that tightly hugs the
     * actual camera dot rather than the padded safe-area.
     */
    const val COLLAPSED_CUTOUT_FACTOR = 0.55f

    /**
     * Duration of the main scale/translation/corner morph. Matches iOS's
     * `.bouncy(duration: 0.3)` in PrettyToastView.swift.
     */
    const val MORPH_DURATION_MS: Long = 300L

    /**
     * Buffer between morph animation end and the onDismiss callback.
     * Matches iOS's `asyncAfter(deadline: .now() + 0.35)` in ToastManager.swift
     * (0.35s total = 0.30s morph + 0.05s buffer).
     */
    const val DISMISS_CALLBACK_BUFFER_MS: Long = 50L
}
