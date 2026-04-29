package com.toast.backdrop

import android.app.Activity
import android.graphics.Bitmap
import android.graphics.Rect
import android.os.Handler
import android.os.Looper
import android.view.PixelCopy
import com.toast.util.Density
import java.lang.ref.WeakReference

enum class BackdropTint { COLORED, GRAY }

/**
 * Samples the pixels beneath the toast pill on a 250 ms tick and flips
 * [onTintChanged] between [BackdropTint.COLORED] (dark backdrop — use the
 * toast's accent colour as the outline) and [BackdropTint.GRAY] (everything
 * lighter — a faint neutral white outline).
 *
 * Mirrors the iOS sampler in `PassThroughWindow.swift`: a 32×8 px bitmap,
 * Rec. 601 luminance, and flip points at 0.050 / 0.060 with hysteresis. iOS
 * uses `CALayer.render(in:)`; we use [PixelCopy.request] against the
 * activity's window, which reads the actual GPU-rendered surface (including
 * our overlay — the self-captured black pill biases the average towards
 * `COLORED` on dark backdrops, which is the correct outcome, and stays well
 * above the flip threshold on any light backdrop where the surrounding
 * pixels dominate the average).
 */
class BackdropSampler(
    activity: Activity,
    density: Density,
    private val onTintChanged: (BackdropTint) -> Unit,
) {
    private val activityRef = WeakReference(activity)
    private val stripHeightPx = density.dpInt(SAMPLE_STRIP_HEIGHT_DP)
    private val handler = Handler(Looper.getMainLooper())
    private var bitmap: Bitmap? =
        Bitmap.createBitmap(BITMAP_WIDTH, BITMAP_HEIGHT, Bitmap.Config.ARGB_8888)
    private val pixels = IntArray(BITMAP_WIDTH * BITMAP_HEIGHT)
    private val srcRect = Rect()

    private var tickRunnable: Runnable? = null
    private var inflight = false
    private var stopped = false
    private var currentTint: BackdropTint = BackdropTint.GRAY

    fun start() {
        stop()
        stopped = false
        sample()
        val r = object : Runnable {
            override fun run() {
                sample()
                handler.postDelayed(this, SAMPLE_INTERVAL_MS)
            }
        }
        tickRunnable = r
        handler.postDelayed(r, SAMPLE_INTERVAL_MS)
    }

    /**
     * Stops the tick loop and releases the backing bitmap. Safe to call
     * multiple times. If a [PixelCopy] request is still in flight the
     * bitmap is recycled inside the callback instead — recycling it here
     * would crash the native copy.
     */
    fun stop() {
        stopped = true
        tickRunnable?.let { handler.removeCallbacks(it) }
        tickRunnable = null
        if (!inflight) {
            bitmap?.recycle()
            bitmap = null
        }
    }

    /** Current tint, so the overlay can sync a freshly-built pill. */
    val tint: BackdropTint get() = currentTint

    private fun sample() {
        if (inflight || stopped) return
        val activity = activityRef.get() ?: return
        val window = activity.window ?: return
        val decorView = window.decorView ?: return
        val w = decorView.width
        val h = decorView.height
        if (w <= 0 || h <= 0) return
        val dst = bitmap ?: return
        srcRect.set(0, 0, w, stripHeightPx.coerceAtMost(h))

        inflight = true
        try {
            PixelCopy.request(window, srcRect, dst, { result ->
                inflight = false
                // If stop() was called while the copy was in flight it
                // deferred the recycle to us — do it now, and bail out of
                // any further processing.
                if (stopped) {
                    bitmap?.recycle()
                    bitmap = null
                    return@request
                }
                if (result == PixelCopy.SUCCESS) processBitmap(dst)
            }, handler)
        } catch (_: IllegalArgumentException) {
            inflight = false
        }
    }

    private fun processBitmap(src: Bitmap) {
        src.getPixels(pixels, 0, BITMAP_WIDTH, 0, 0, BITMAP_WIDTH, BITMAP_HEIGHT)

        var total = 0.0
        for (p in pixels) {
            val r = ((p shr 16) and 0xFF) / 255.0
            val g = ((p shr 8) and 0xFF) / 255.0
            val b = (p and 0xFF) / 255.0
            total += 0.299 * r + 0.587 * g + 0.114 * b
        }
        val avg = total / pixels.size

        // Single flip point at ~#0E (≈0.055), matching Apple's DI. ±0.005
        // hysteresis stops backdrops right on the boundary flickering.
        val next = when (currentTint) {
            BackdropTint.COLORED -> if (avg > FLIP_HIGH) BackdropTint.GRAY else BackdropTint.COLORED
            BackdropTint.GRAY -> if (avg < FLIP_LOW) BackdropTint.COLORED else BackdropTint.GRAY
        }
        if (next != currentTint) {
            currentTint = next
            onTintChanged(next)
        }
    }

    companion object {
        private const val SAMPLE_INTERVAL_MS = 250L
        private const val BITMAP_WIDTH = 32
        private const val BITMAP_HEIGHT = 8
        private const val SAMPLE_STRIP_HEIGHT_DP = 80f
        private const val FLIP_LOW = 0.050
        private const val FLIP_HIGH = 0.060
    }
}
