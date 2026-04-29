package com.toast.anim

/**
 * Common surface for the two toast animation strategies (cutout-morph
 * and slide-spring) so the gesture handler doesn't branch on which one
 * is active.
 */
interface ToastAnimator {
    fun show()
    fun dismiss(onEnd: () -> Unit)

    /**
     * Called on every ACTION_MOVE of an in-progress pill drag.
     *
     * @param dy raw finger delta since ACTION_DOWN (negative = upward).
     * @param translationYOnDown pill.translationY captured at ACTION_DOWN
     *        — used by the slide animator to resume relative translation.
     */
    fun applyDrag(dy: Float, translationYOnDown: Float)

    /** Release without dismiss: restore to the resting expanded state. */
    fun snapBack()
}
