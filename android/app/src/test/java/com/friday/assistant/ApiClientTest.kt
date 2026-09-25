package com.friday.assistant

import com.friday.assistant.network.FridayApiClient
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ApiClientTest {

    @Test
    fun testValidHttpEmulatorUrl() {
        assertTrue(FridayApiClient.isValidBaseUrl("http://10.0.2.2:8080"))
        assertTrue(FridayApiClient.isValidBaseUrl("http://127.0.0.1:8080"))
        assertTrue(FridayApiClient.isValidBaseUrl("http://localhost:8080"))
    }

    @Test
    fun testValidLanIpUrl() {
        assertTrue(FridayApiClient.isValidBaseUrl("http://192.168.1.15:8080"))
        assertTrue(FridayApiClient.isValidBaseUrl("http://192.168.29.144:8080"))
        assertTrue(FridayApiClient.isValidBaseUrl("http://10.0.0.5:8000"))
    }

    @Test
    fun testValidHttpsUrl() {
        assertTrue(FridayApiClient.isValidBaseUrl("https://friday.internal.domain:8443"))
        assertTrue(FridayApiClient.isValidBaseUrl("https://api.myassistant.ai"))
    }

    @Test
    fun testInvalidUrl() {
        assertFalse(FridayApiClient.isValidBaseUrl("not_a_url"))
        assertFalse(FridayApiClient.isValidBaseUrl("ftp://10.0.2.2:8080"))
        assertFalse(FridayApiClient.isValidBaseUrl(""))
    }
}
