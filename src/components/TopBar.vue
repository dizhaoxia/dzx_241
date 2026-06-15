<template>
  <div class="topbar">
    <div class="topbar-left">
      <div class="logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        <span class="logo-text">AnnotateX</span>
      </div>
    </div>

    <div class="topbar-center">
      <el-upload
        :auto-upload="false"
        :show-file-list="false"
        accept=".jpg,.jpeg,.png"
        :on-change="handleFileChange"
      >
        <button class="topbar-btn" title="上传图片">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span>上传图片</span>
        </button>
      </el-upload>

      <div class="divider"></div>

      <button class="topbar-btn" @click="handleExport" title="导出JSON">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>导出</span>
      </button>

      <el-upload
        :auto-upload="false"
        :show-file-list="false"
        accept=".json"
        :on-change="handleImport"
      >
        <button class="topbar-btn" title="导入JSON">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span>导入</span>
        </button>
      </el-upload>

      <div class="divider"></div>

      <button class="topbar-btn align-btn" @click="handleDistributeHorizontal" title="水平等距分布 (Ctrl+Shift+H)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="6" x2="4" y2="18"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
          <line x1="20" y1="6" x2="20" y2="18"/>
          <line x1="2" y1="12" x2="22" y2="12" stroke-dasharray="2,2"/>
        </svg>
        <span>水平等距</span>
      </button>

      <button class="topbar-btn align-btn" @click="handleDistributeVertical" title="垂直等距分布 (Ctrl+Shift+V)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="6" y1="4" x2="18" y2="4"/>
          <line x1="4" y1="12" x2="20" y2="12"/>
          <line x1="6" y1="20" x2="18" y2="20"/>
          <line x1="12" y1="2" x2="12" y2="22" stroke-dasharray="2,2"/>
        </svg>
        <span>垂直等距</span>
      </button>

      <div class="divider"></div>

      <button class="topbar-btn danger" @click="handleClearAll" title="清空所有">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        <span>清空</span>
      </button>

      <div class="divider"></div>

      <button class="topbar-btn" :class="{ active: !annotationsVisible }" @click="handleToggleVisible" title="显示/隐藏标注 (Ctrl+H)">
        <svg v-if="annotationsVisible" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
        <span>{{ annotationsVisible ? '隐藏' : '显示' }}</span>
      </button>

      <div class="opacity-control" title="标注填充透明度">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="21" x2="21" y2="3"/>
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          :value="fillOpacity"
          @input="handleOpacityChange"
          class="opacity-slider"
        />
        <span class="opacity-value">{{ Math.round(fillOpacity * 100) }}%</span>
      </div>
    </div>

    <div class="topbar-right">
      <span class="zoom-label">{{ Math.round(zoomLevel * 100) }}%</span>
    </div>
  </div>
</template>

<script setup>
import { useCanvasState } from '../composables/useCanvasState'
import { useAnnotationData } from '../composables/useAnnotationData'
import { ElMessage } from 'element-plus'

const { zoomLevel, loadImage, distributeHorizontal, distributeVertical, annotationsVisible, fillOpacity, toggleAnnotationsVisible, setFillOpacity } = useCanvasState()
const { handleExport, handleImport, handleClearAll } = useAnnotationData()

const handleToggleVisible = () => {
  toggleAnnotationsVisible()
  ElMessage.success(annotationsVisible.value ? '已隐藏所有标注' : '已显示所有标注')
}

const handleOpacityChange = (e) => {
  const value = parseFloat(e.target.value)
  setFillOpacity(value)
}

const handleFileChange = (file) => {
  if (file && file.raw) {
    loadImage(file.raw)
  }
}

const handleDistributeHorizontal = () => {
  const result = distributeHorizontal()
  if (!result) {
    ElMessage.warning('请至少选中 3 个标注框')
  } else {
    ElMessage.success('已水平等距分布')
  }
}

const handleDistributeVertical = () => {
  const result = distributeVertical()
  if (!result) {
    ElMessage.warning('请至少选中 3 个标注框')
  } else {
    ElMessage.success('已垂直等距分布')
  }
}
</script>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  height: var(--topbar-height);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 0 16px;
  gap: 12px;
  flex-shrink: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--accent);
}

.logo-text {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: -0.5px;
}

.topbar-center {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 auto;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.divider {
  width: 1px;
  height: 24px;
  background: var(--border);
  margin: 0 4px;
}

.topbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-family: 'Noto Sans SC', sans-serif;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.topbar-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border);
}

.topbar-btn.danger:hover {
  background: rgba(245, 158, 11, 0.1);
  color: var(--danger);
  border-color: rgba(245, 158, 11, 0.3);
}

.topbar-btn.active {
  background: var(--accent-dim);
  color: var(--accent);
  border-color: var(--accent);
}

.opacity-control {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
}

.opacity-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100px;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.opacity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s ease;
}

.opacity-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 0 0 3px var(--accent-dim);
}

.opacity-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.opacity-slider::-moz-range-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 0 0 3px var(--accent-dim);
}

.opacity-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-muted);
  min-width: 32px;
  text-align: right;
}

:deep(.el-upload) {
  display: inline-flex;
}
</style>
