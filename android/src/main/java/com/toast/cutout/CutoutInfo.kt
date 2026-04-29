package com.toast.cutout

import android.graphics.Rect

/**
 * Snapshot of cutout/screen geometry captured once per toast show.
 *
 * Replaces the per-access computed properties the old monolithic overlay
 * had for `collapsedWidth`, `collapsedHeight`, `cutoutHorizontalOffset`,
 * etc. — we read these many times per animation frame, so paying the
 * measurement cost once up-front matters.
 */
data class CutoutInfo(
    val hasCutout: Boolean,
    val rect: Rect?,
    /** Width the pill morphs to when collapsed onto the cutout. */
    val collapsedWidth: Float,
    /** Height the pill morphs to when collapsed onto the cutout. */
    val collapsedHeight: Float,
    /**
     * Horizontal translation (px) needed to slide a centered pill so
     * its center aligns with the cutout. Zero for centered punch-holes,
     * non-zero for corner cameras.
     */
    val horizontalOffset: Float,
    val screenCornerRadius: Int,
    val statusBarHeight: Int,
)
