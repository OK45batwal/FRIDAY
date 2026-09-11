package com.friday.assistant.ai

import kotlinx.coroutines.flow.Flow

data class ModelProfile(val id: String, val label: String, val ramMb: Long, val contextTokens: Int)
data class InferenceStats(val loaded: Boolean, val modelId: String? = null, val tokensPerSecond: Double? = null)

interface LocalLlmEngine {
    suspend fun load(model: ModelProfile): Result<Unit>
    suspend fun unload()
    fun isLoaded(): Boolean
    fun stream(prompt: String, context: List<String>): Flow<String>
    fun cancel()
    fun stats(): InferenceStats
}

class ModelManager(private val engine: LocalLlmEngine) {
    private var selected: ModelProfile? = null
    suspend fun load(model: ModelProfile): Result<Unit> {
        selected = model
        return engine.load(model)
    }
    suspend fun unload() { engine.unload() }
    fun selectedModel(): ModelProfile? = selected
    fun stats(): InferenceStats = engine.stats()
}

/** Deliberate safe default until an approved on-device inference runtime and model are installed. */
class UnavailableLocalLlmEngine : LocalLlmEngine {
    override suspend fun load(model: ModelProfile) = Result.failure<Unit>(
        IllegalStateException("No local model runtime is installed. Deterministic tools remain available offline.")
    )
    override suspend fun unload() = Unit
    override fun isLoaded() = false
    override fun stream(prompt: String, context: List<String>): Flow<String> = kotlinx.coroutines.flow.flow {
        emit("A local model is not installed. Open Model settings to add a compatible model.")
    }
    override fun cancel() = Unit
    override fun stats() = InferenceStats(loaded = false)
}
