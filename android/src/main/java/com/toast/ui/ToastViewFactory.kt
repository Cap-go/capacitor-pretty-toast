package com.toast.ui

import android.app.Activity
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import com.toast.cutout.CutoutInfo
import com.toast.util.Density
import kotlin.math.sqrt

/**
 * Builds the full toast view hierarchy (container → pill → content →
 * icon + title/message) and computes the position/size/corner-radius
 * geometry up-front so the animator has stable values to work with.
 */
class ToastViewFactory(
    private val activity: Activity,
    private val density: Density,
) {

    /** Everything the overlay needs to animate & populate the toast. */
    data class Built(
        val container: PassThroughFrameLayout,
        val pill: LinearLayout,
        val content: LinearLayout,
        val icon: ImageView,
        val title: TextView,
        val message: TextView,
        val actionButton: TextView,
        /** Resting corner radius of the expanded pill (px). */
        val expandedCornerRadius: Float,
        /** Mutable background so the outline stroke can be crossfaded. */
        val pillBackground: GradientDrawable,
        /** Stroke line width (px), mirroring iOS's 2 pt. */
        val strokeWidthPx: Int,
    )

    fun build(info: CutoutInfo): Built {
        val screenWidth = activity.resources.displayMetrics.widthPixels

        val container = PassThroughFrameLayout(activity).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            visibility = ViewGroup.GONE
        }

        val strokeWidthPx = density.dpInt(2f)
        val pillBackground = GradientDrawable().apply {
            setColor(Color.BLACK)
            cornerRadius = density.dp(30f)
            // Reserve space for the outline from the start — stroke colour
            // is updated later by the backdrop sampler. Start transparent so
            // the initial frame has no visible outline.
            setStroke(strokeWidthPx, Color.TRANSPARENT)
        }
        val pill = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            background = pillBackground
            elevation = density.dp(8f)
        }

        val topMargin = computeTopMargin(info)
        val pillMargin = computePillMargin(info.screenCornerRadius, topMargin)
        val pillWidth = screenWidth - pillMargin * 2

        val expandedCornerRadius = computeExpandedCornerRadius(info, pillMargin, topMargin)
        pillBackground.cornerRadius = expandedCornerRadius

        pill.layoutParams = FrameLayout.LayoutParams(
            pillWidth,
            FrameLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            this.topMargin = topMargin
        }

        val content = buildContent(info, topMargin)
        val icon = buildIcon()
        val textContainer = buildTextContainer()
        val title = buildTitle()
        val message = buildMessage()
        val actionButton = buildActionButton()

        textContainer.addView(title)
        textContainer.addView(message)
        content.addView(icon)
        content.addView(textContainer)
        content.addView(actionButton)
        pill.addView(content)
        container.addView(pill)
        container.pillView = pill

        return Built(
            container = container,
            pill = pill,
            content = content,
            icon = icon,
            title = title,
            message = message,
            actionButton = actionButton,
            expandedCornerRadius = expandedCornerRadius,
            pillBackground = pillBackground,
            strokeWidthPx = strokeWidthPx,
        )
    }

    /** Aligns the pill's top with the cutout (or below the status bar). */
    private fun computeTopMargin(info: CutoutInfo): Int {
        val rect = info.rect
        return if (info.hasCutout && rect != null) {
            if (rect.top > 0) {
                rect.top
            } else {
                // Cutout flush against the screen edge — nudge down a touch
                // so the pill doesn't sit literally at y=0.
                (rect.centerY() / 3).coerceAtLeast(density.dpInt(4f))
            }
        } else {
            info.statusBarHeight + density.dpInt(10f)
        }
    }

    /**
     * Computes horizontal inset so the pill's top corners stay inside the
     * rounded screen corners. Using the circle equation:
     *   x = r − sqrt(r² − (r − y)²)
     * gives the horizontal distance from the screen edge at vertical
     * offset `y` from the top, for a corner of radius `r`.
     */
    private fun computePillMargin(screenCornerRadius: Int, topMargin: Int): Int {
        val defaultMargin = density.dpInt(10f)
        if (screenCornerRadius <= 0 || topMargin >= screenCornerRadius) {
            return defaultMargin
        }
        val r = screenCornerRadius.toDouble()
        val y = topMargin.toDouble()
        val horizontalInset = (r - sqrt(r * r - (r - y) * (r - y))).toInt()
        return (horizontalInset + density.dpInt(4f)).coerceAtLeast(defaultMargin)
    }

    /** Concentric corner radius so the pill hugs the screen's rounded corners. */
    private fun computeExpandedCornerRadius(info: CutoutInfo, pillMargin: Int, topMargin: Int): Float {
        if (!info.hasCutout || info.screenCornerRadius <= 0) {
            return density.dp(30f)
        }
        val inset = maxOf(pillMargin, topMargin)
        return (info.screenCornerRadius - inset).toFloat().coerceAtLeast(density.dp(20f))
    }

    private fun buildContent(info: CutoutInfo, topMargin: Int): LinearLayout {
        val hPad = density.dpInt(20f)
        val vPad = density.dpInt(14f)
        val topPad = if (info.hasCutout && info.rect != null) {
            // Push content below the camera hole: camera bottom - pill top + gap.
            (info.rect.bottom - topMargin + density.dpInt(6f)).coerceAtLeast(vPad)
        } else {
            vPad
        }
        return LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(hPad, topPad, hPad, vPad)
        }
    }

    private fun buildIcon(): ImageView = ImageView(activity).apply {
        layoutParams = LinearLayout.LayoutParams(density.dpInt(50f), density.dpInt(35f))
        scaleType = ImageView.ScaleType.CENTER_INSIDE
    }

    private fun buildTextContainer(): LinearLayout = LinearLayout(activity).apply {
        orientation = LinearLayout.VERTICAL
        layoutParams = LinearLayout.LayoutParams(
            0,
            LinearLayout.LayoutParams.WRAP_CONTENT,
            1f
        ).apply {
            marginStart = density.dpInt(10f)
        }
    }

    private fun buildTitle(): TextView = TextView(activity).apply {
        setTextColor(Color.WHITE)
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
        typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
    }

    private fun buildMessage(): TextView = TextView(activity).apply {
        setTextColor(Color.argb(153, 255, 255, 255))
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
    }

    private fun buildActionButton(): TextView = TextView(activity).apply {
        visibility = ViewGroup.GONE
        setTextColor(Color.WHITE)
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
        typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
        val hPad = density.dpInt(12f)
        val vPad = density.dpInt(6f)
        setPadding(hPad, vPad, hPad, vPad)
        val bg = GradientDrawable().apply {
            setColor(Color.argb(30, 255, 255, 255))
            cornerRadius = density.dp(20f)
        }
        background = bg
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            marginStart = density.dpInt(8f)
        }
        isClickable = true
        isFocusable = true
    }
}
