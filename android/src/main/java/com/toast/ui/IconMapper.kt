package com.toast.ui

import android.graphics.Color
import com.toast.R

/**
 * Resolves an iOS-style SF Symbol name (e.g. "checkmark.circle.fill") to a
 * bundled drawable resource + tint color. Mapping is deliberately loose
 * (substring matching) so the JS side can pass any symbol that contains
 * the relevant keyword.
 */
object IconMapper {
    fun map(symbolName: String): Pair<Int, Int> = when {
        symbolName.contains("checkmark") -> R.drawable.ic_check_circle to Color.parseColor("#4CAF50")
        symbolName.contains("xmark") -> R.drawable.ic_cancel to Color.parseColor("#F44336")
        symbolName.contains("exclamation") -> R.drawable.ic_warning to Color.parseColor("#FF9800")
        symbolName.contains("info") -> R.drawable.ic_info to Color.parseColor("#2196F3")
        symbolName.contains("heart") -> R.drawable.ic_favorite to Color.parseColor("#E91E63")
        symbolName.contains("arrow.down") -> R.drawable.ic_arrow_downward to Color.parseColor("#2196F3")
        symbolName.contains("arrow") -> R.drawable.ic_arrow_upward to Color.parseColor("#2196F3")
        symbolName.contains("envelope") || symbolName.contains("mail") -> R.drawable.ic_mail to Color.parseColor("#2196F3")
        symbolName.contains("wifi") -> R.drawable.ic_wifi to Color.WHITE
        symbolName.contains("hand") || symbolName.contains("tap") -> R.drawable.ic_touch_app to Color.WHITE
        else -> R.drawable.ic_notifications to Color.GRAY
    }
}
