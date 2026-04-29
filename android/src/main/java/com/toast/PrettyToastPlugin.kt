package com.toast

import android.app.Activity
import android.graphics.Color
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "PrettyToast")
class PrettyToastPlugin : Plugin() {
    private var overlay: ToastOverlay? = null
    private var overlayActivity: Activity? = null
    private var currentToastId: String? = null

    @PluginMethod
    fun showCurrentToast(call: PluginCall) {
        val payload = parsePayload(call) ?: return
        val overlay = ensureOverlay() ?: run {
            call.reject("Activity is unavailable")
            return
        }

        currentToastId = payload.id

        activity?.runOnUiThread {
            overlay.show(
                payload.icon,
                payload.iconUri,
                payload.title,
                payload.message,
                payload.duration,
                payload.autoDismiss,
                payload.enableSwipeDismiss,
                payload.useDynamicIsland,
                payload.accentColor,
                payload.strokeColor,
                payload.disableBackdropSampling,
                payload.actionLabel,
                payload.accessibilityAnnouncement,
            )
            call.resolve()
        }
    }

    @PluginMethod
    fun updateCurrentToast(call: PluginCall) {
        val payload = parsePayload(call) ?: return
        if (currentToastId != null && currentToastId != payload.id) {
            call.resolve()
            return
        }

        val overlay = ensureOverlay() ?: run {
            call.reject("Activity is unavailable")
            return
        }

        activity?.runOnUiThread {
            overlay.update(
                payload.icon,
                payload.iconUri,
                payload.title,
                payload.message,
                payload.duration,
                payload.autoDismiss,
                payload.accentColor,
                payload.strokeColor,
                payload.disableBackdropSampling,
                payload.actionLabel,
            )
            call.resolve()
        }
    }

    @PluginMethod
    fun dismissCurrentToast(call: PluginCall) {
        val requestedId = call.getString("id")
        if (requestedId != null && currentToastId != null && requestedId != currentToastId) {
            call.resolve()
            return
        }

        activity?.runOnUiThread {
            overlay?.dismiss()
            call.resolve()
        } ?: call.resolve()
    }

    override fun handleOnDestroy() {
        overlay?.destroy()
        overlay = null
        overlayActivity = null
        currentToastId = null
    }

    private fun ensureOverlay(): ToastOverlay? {
        val activity = activity ?: return null
        if (overlay == null || overlayActivity !== activity) {
            overlay?.destroy()
            overlayActivity = activity
            overlay = ToastOverlay(activity).apply {
                onDismiss = {
                    val toastId = currentToastId
                    if (toastId != null) {
                        notifyListeners("toastDismiss", JSObject().put("id", toastId))
                        currentToastId = null
                    }
                }
                onPress = {
                    val toastId = currentToastId
                    if (toastId != null) {
                        notifyListeners("toastPress", JSObject().put("id", toastId))
                    }
                }
                onActionPress = {
                    val toastId = currentToastId
                    if (toastId != null) {
                        notifyListeners("toastActionPress", JSObject().put("id", toastId))
                    }
                }
            }
        }

        return overlay
    }

    private fun parsePayload(call: PluginCall): ToastPayload? {
        val id = call.getString("id")
        if (id.isNullOrBlank()) {
            call.reject("Missing required parameter: id")
            return null
        }

        return ToastPayload(
            id = id,
            icon = call.getString("icon") ?: "",
            iconUri = call.getString("iconUri") ?: "",
            title = call.getString("title") ?: "",
            message = call.getString("message") ?: "",
            duration = call.getInt("duration") ?: 3000,
            autoDismiss = call.getBoolean("autoDismiss") ?: true,
            enableSwipeDismiss = call.getBoolean("enableSwipeDismiss") ?: true,
            useDynamicIsland = call.getBoolean("useDynamicIsland") ?: true,
            accentColor = parseColor(call.getString("accentColor")),
            strokeColor = parseColor(call.getString("strokeColor")),
            disableBackdropSampling = call.getBoolean("disableBackdropSampling") ?: false,
            actionLabel = call.getString("actionLabel") ?: "",
            accessibilityAnnouncement = call.getString("accessibilityAnnouncement") ?: "",
        )
    }

    private fun parseColor(value: String?): Int? {
        if (value.isNullOrBlank()) return null

        return try {
            when {
                value.startsWith("rgb(", ignoreCase = true) -> parseRgbColor(value)
                value.startsWith("rgba(", ignoreCase = true) -> parseRgbaColor(value)
                else -> Color.parseColor(value)
            }
        } catch (_: IllegalArgumentException) {
            null
        }
    }

    private fun parseRgbColor(value: String): Int {
        val content = value.substringAfter("(").substringBeforeLast(")")
        val components = content.split(",").map { it.trim().toInt() }
        return Color.rgb(components[0], components[1], components[2])
    }

    private fun parseRgbaColor(value: String): Int {
        val content = value.substringAfter("(").substringBeforeLast(")")
        val components = content.split(",").map { it.trim() }
        val alpha = (components[3].toFloat() * 255).toInt().coerceIn(0, 255)
        return Color.argb(alpha, components[0].toInt(), components[1].toInt(), components[2].toInt())
    }
}

private data class ToastPayload(
    val id: String,
    val icon: String,
    val iconUri: String,
    val title: String,
    val message: String,
    val duration: Int,
    val autoDismiss: Boolean,
    val enableSwipeDismiss: Boolean,
    val useDynamicIsland: Boolean,
    val accentColor: Int?,
    val strokeColor: Int?,
    val disableBackdropSampling: Boolean,
    val actionLabel: String,
    val accessibilityAnnouncement: String,
)
