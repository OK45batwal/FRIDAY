package com.friday.assistant

import com.friday.assistant.device.ResourceAction
import com.friday.assistant.device.ResourceManager
import com.friday.assistant.device.ResourceState
import org.junit.Assert.assertEquals
import org.junit.Test

class ResourceManagerTest {
    @Test fun critical_memory_unloads_model() {
        assertEquals(ResourceAction.UNLOAD_MODEL, ResourceManager.recommendedAction(ResourceState(500, 60, false, 0)))
    }
    @Test fun low_battery_prefers_small_model() {
        assertEquals(ResourceAction.PREFER_SMALL_MODEL, ResourceManager.recommendedAction(ResourceState(2000, 10, false, 0)))
    }
}
