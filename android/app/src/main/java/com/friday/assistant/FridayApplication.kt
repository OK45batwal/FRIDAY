package com.friday.assistant

import android.app.Application
import com.friday.assistant.data.FridayDatabase

class FridayApplication : Application() {
    val database by lazy { FridayDatabase.create(this) }
}
