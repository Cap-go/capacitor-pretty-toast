package com.toast.util

import android.content.res.Resources

/**
 * Caches the display density so `dp(...)` doesn't re-enter
 * `Resources.displayMetrics` on every conversion.
 */
class Density(val scale: Float) {
    fun dp(v: Float): Float = v * scale
    fun dpInt(v: Float): Int = (v * scale).toInt()

    companion object {
        fun from(resources: Resources): Density =
            Density(resources.displayMetrics.density)
    }
}
