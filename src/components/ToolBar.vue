<template>
  <div class="toolbar">
    <div class="tool-group">
      <button
        class="tool-btn"
        :class="{ active: activeTool === 'select' }"
        @click="setActiveTool('select')"
        data-tip="选择 (V)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
          <path d="M13 13l6 6"/>
        </svg>
      </button>

      <button
        class="tool-btn"
        :class="{ active: activeTool === 'rect' }"
        @click="setActiveTool('rect')"
        data-tip="矩形 (R)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        </svg>
      </button>

      <button
        class="tool-btn"
        :class="{ active: activeTool === 'polygon' }"
        @click="setActiveTool('polygon')"
        data-tip="多边形 (P)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 22 8.5 18 20 6 20 2 8.5"/>
        </svg>
      </button>

      <button
        class="tool-btn"
        :class="{ active: activeTool === 'text' }"
        @click="setActiveTool('text')"
        data-tip="文本 (T)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="4 7 4 4 20 4 20 7"/>
          <line x1="9.5" y1="20" x2="14.5" y2="20"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
      </button>
    </div>

    <div class="tool-info">
      <span class="tool-label">{{ toolLabel }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useCanvasState } from '../composables/useCanvasState'

const { activeTool, setActiveTool, canvas } = useCanvasState()

const toolLabels = {
  select: '选择',
  rect: '矩形',
  polygon: '多边形',
  text: '文本',
}

const toolLabel = computed(() => toolLabels[activeTool.value] || '选择')

const handleKeyDown = (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') return

  switch (e.key.toLowerCase()) {
    case 'v':
      setActiveTool('select')
      break
    case 'r':
      setActiveTool('rect')
      break
    case 'p':
      setActiveTool('polygon')
      break
    case 't':
      setActiveTool('text')
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.toolbar {
  width: var(--toolbar-width);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 8px;
  flex-shrink: 0;
}

.tool-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tool-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
}

.tool-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.tool-btn.active {
  background: var(--accent-dim);
  color: var(--accent);
}

.tool-btn.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--accent);
  border-radius: 0 3px 3px 0;
}

.tool-info {
  margin-top: auto;
  padding: 8px 0;
}

.tool-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--text-muted);
  writing-mode: vertical-rl;
  text-orientation: mixed;
  letter-spacing: 1px;
}
</style>
