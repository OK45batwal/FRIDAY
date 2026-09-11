package com.friday.assistant.data

import android.content.Context
import androidx.room.Database
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Room
import androidx.room.RoomDatabase

@Entity(tableName = "messages") data class MessageEntity(@PrimaryKey(autoGenerate = true) val id: Long = 0, val role: String, val text: String, val createdAt: Long = System.currentTimeMillis())
@Entity(tableName = "memories") data class MemoryEntity(@PrimaryKey(autoGenerate = true) val id: Long = 0, val fact: String, val createdAt: Long = System.currentTimeMillis())

@Database(entities = [MessageEntity::class, MemoryEntity::class], version = 1, exportSchema = false)
abstract class FridayDatabase : RoomDatabase() {
    companion object { fun create(context: Context) = Room.databaseBuilder(context, FridayDatabase::class.java, "friday-local.db").build() }
}
