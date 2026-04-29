package com.toast.anim

import android.widget.LinearLayout
import androidx.dynamicanimation.animation.DynamicAnimation
import androidx.dynamicanimation.animation.SpringAnimation
import androidx.dynamicanimation.animation.SpringForce
import com.toast.util.Density

/**
 * Fallback animation for devices without a top cutout — a spring-based
 * drop-down from offscreen, with matching spring on snap-back and a
 * faster damped spring on dismiss.
 */
class SlideAnimator(
    private val pill: LinearLayout,
    private val density: Density,
) : ToastAnimator {

    private fun offscreenY(): Float = -density.dp(200f)

    override fun show() {
        pill.translationY = offscreenY()
        pill.alpha = 1f

        SpringAnimation(pill, DynamicAnimation.TRANSLATION_Y, 0f).apply {
            spring.apply {
                dampingRatio = 0.75f
                stiffness = SpringForce.STIFFNESS_MEDIUM
            }
            start()
        }
    }

    override fun dismiss(onEnd: () -> Unit) {
        val spring = SpringAnimation(pill, DynamicAnimation.TRANSLATION_Y, offscreenY()).apply {
            spring.apply {
                dampingRatio = SpringForce.DAMPING_RATIO_NO_BOUNCY
                stiffness = SpringForce.STIFFNESS_MEDIUM
            }
            addEndListener { _, _, _, _ -> onEnd() }
        }
        spring.start()

        pill.animate()
            .alpha(0f)
            .setDuration(250)
            .start()
    }

    override fun applyDrag(dy: Float, translationYOnDown: Float) {
        if (dy >= 0f) return // upward drag only
        pill.translationY = translationYOnDown + dy
    }

    override fun snapBack() {
        SpringAnimation(pill, DynamicAnimation.TRANSLATION_Y, 0f).apply {
            spring.apply {
                dampingRatio = 0.75f
                stiffness = SpringForce.STIFFNESS_MEDIUM
            }
            start()
        }
    }
}
