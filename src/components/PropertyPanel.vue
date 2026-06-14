<template>
  <div class="property-panel">
    <div class="panel-header">
      <span class="panel-title">属性</span>
    </div>

    <div class="panel-body" v-if="selectedObject">
      <div class="prop-section">
        <div class="prop-label">类型</div>
        <div class="prop-value">
          <span class="type-badge" :class="selectedObject._annotationType">
            {{ typeLabel }}
          </span>
        </div>
      </div>

      <div class="prop-section" v-if="selectedObject._annotationType === 'rect'">
        <div class="prop-label">位置</div>
        <div class="prop-grid">
          <div class="prop-item">
            <span class="prop-key">X</span>
            <span class="prop-val">{{ Math.round(selectedObject.left || 0) }}</span>
          </div>
          <div class="prop-item">
            <span class="prop-key">Y</span>
            <span class="prop-val">{{ Math.round(selectedObject.top || 0) }}</span>
          </div>
          <div class="prop-item">
            <span class="prop-key">W</span>
            <span class="prop-val">{{ Math.round((selectedObject.width || 0) * (selectedObject.scaleX || 1)) }}</span>
          </div>
          <div class="prop-item">
            <span class="prop-key">H</span>
            <span class="prop-val">{{ Math.round((selectedObject.height || 0) * (selectedObject.scaleY || 1)) }}</span>
          </div>
        </div>
      </div>

      <div class="prop-section" v-if="selectedObject._annotationType === 'polygon'">
        <div class="prop-label">顶点数</div>
        <div class="prop-value">{{ selectedObject.points ? selectedObject.points.length : 0 }}</div>
      </div>

      <div class="prop-section" v-if="selectedObject._annotationType === 'text' || selectedObject._annotationType === 'label'">
        <div class="prop-label">内容</div>
        <div class="prop-value text-content">{{ selectedObject.text || '(空)' }}</div>
      </div>

      <div class="prop-section">
        <div class="prop-label">ID</div>
        <div class="prop-value mono">{{ shortId }}</div>
      </div>
    </div>

    <div class="panel-empty" v-else>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <p>选中标注查看属性</p>
    </div>

    <div class="panel-footer">
      <div class="stats">
        <span class="stat-item">
          <span class="stat-num">{{ annotationCount }}</span>
          <span class="stat-label">标注</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCanvasState } from '../composables/useCanvasState'

const { selectedObject, annotations } = useCanvasState()

const typeLabels = {
  rect: '矩形',
  polygon: '多边形',
  text: '文本',
  label: '标签',
}

const typeLabel = computed(() => {
  if (!selectedObject.value) return ''
  return typeLabels[selectedObject.value._annotationType] || '未知'
})

const shortId = computed(() => {
  if (!selectedObject.value || !selectedObject.value._annotationId) return '-'
  return selectedObject.value._annotationId.slice(0, 8)
})

const annotationCount = computed(() => annotations.value.length)
</script>

<style scoped>
.property-panel {
  width: var(--panel-width);
  background: var(--bg-secondary);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.panel-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.prop-section {
  margin-bottom: 16px;
}

.prop-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.prop-value {
  font-size: 13px;
  color: var(--text-primary);
}

.prop-value.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-muted);
}

.prop-value.text-content {
  max-height: 80px;
  overflow-y: auto;
  word-break: break-all;
}

.type-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.type-badge.rect {
  background: rgba(6, 182, 212, 0.15);
  color: #22d3ee;
}

.type-badge.polygon {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
}

.type-badge.text,
.type-badge.label {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.prop-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.prop-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-primary);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
}

.prop-key {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--accent);
  font-weight: 600;
}

.prop-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-primary);
}

.panel-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 12px;
}

.panel-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border);
}

.stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 16px;
  font-weight: 600;
  color: var(--accent);
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
}
</style>
