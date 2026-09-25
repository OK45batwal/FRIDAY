package com.friday.assistant

import android.app.Application
import android.content.Context
import com.friday.assistant.data.FridayDatabase
import com.friday.assistant.network.FridayApiClient

class FridayApplication : Application() {
    val database by lazy { FridayDatabase.create(this) }

    override fun onCreate() {
        super.onCreate()
        FridayClientHolder.init(this)
    }
}

object FridayClientHolder {
    private const val PREFS_NAME = "friday_prefs"
    private const val KEY_SERVER_URL = "server_url"
    const val DEFAULT_SERVER_URL = "http://10.0.2.2:8080"

    @Volatile
    private var clientInstance: FridayApiClient? = null

    fun init(context: Context) {
        if (clientInstance == null) {
            synchronized(this) {
                if (clientInstance == null) {
                    val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                    val savedUrl = prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL) ?: DEFAULT_SERVER_URL
                    clientInstance = FridayApiClient(baseUrl = savedUrl)
                }
            }
        }
    }

    fun getClient(context: Context): FridayApiClient {
        init(context)
        return clientInstance!!
    }

    fun getBaseUrl(context: Context): String {
        val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL) ?: DEFAULT_SERVER_URL
    }

    fun setBaseUrl(context: Context, url: String): Boolean {
        if (!FridayApiClient.isValidBaseUrl(url)) return false
        val clean = url.trim()
        val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_SERVER_URL, clean).apply()
        getClient(context).baseUrl = clean
        return true
    }
}
