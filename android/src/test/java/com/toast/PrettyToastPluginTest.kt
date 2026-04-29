package com.toast

import com.getcapacitor.PluginMethod
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test

class PrettyToastPluginTest {
    @Test
    fun pluginClassExists() {
        assertNotNull(PrettyToastPlugin())
    }

    @Test
    fun pluginMethodsAreAnnotated() {
        val methodNames = PrettyToastPlugin::class.java.declaredMethods
            .filter { it.getAnnotation(PluginMethod::class.java) != null }
            .map { it.name }
            .sorted()

        assertEquals(
            listOf("dismissCurrentToast", "showCurrentToast", "updateCurrentToast"),
            methodNames,
        )
    }
}
