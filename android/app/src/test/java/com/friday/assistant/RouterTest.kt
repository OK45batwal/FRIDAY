package com.friday.assistant

import com.friday.assistant.ai.Route
import com.friday.assistant.ai.Router
import org.junit.Assert.assertEquals
import org.junit.Test

class RouterTest {
    private val router = Router()
    @Test fun battery_uses_tool_without_llm() = assertEquals(Route.Tool("battery"), router.route("What's my battery level?"))
    @Test fun stop_is_a_cancellation_command() = assertEquals(Route.Stop, router.route("FRIDAY stop"))
    @Test fun explanation_uses_local_llm() = assertEquals(Route.LocalLlm, router.route("Explain quantum entanglement"))
}
