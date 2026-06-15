<template>
  <div class="app-layout">
    <TopBar />
    <div class="app-body">
      <ToolBar />
      <CanvasArea />
      <PropertyPanel />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import TopBar from './components/TopBar.vue'
import ToolBar from './components/ToolBar.vue'
import CanvasArea from './components/CanvasArea.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import { useCanvasState } from './composables/useCanvasState'
import { ElMessage } from 'element-plus'

const { setActiveTool, canvas, removeAnnotation, setSelectedObject, distributeHorizontal, distributeVertical, toggleAnnotationsVisible, annotationsVisible } = useCanvasState()

const handleKeyDown = (e) => {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    const active = document.activeElement
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.contentEditable === 'true')) {
      return
    }
    if (canvas.value) {
      const activeObj = canvas.value.getActiveObject()
      if (activeObj) {
        e.preventDefault()

        if (activeObj.type === 'activeSelection') {
          const objects = activeObj.getObjects()
          const idsToRemove = new Set()
          objects.forEach(obj => {
            if (obj._annotationId) {
              idsToRemove.add(obj._annotationId)
            }
          })
          canvas.value.discardActiveObject()
          idsToRemove.forEach(id => {
            const allObjects = canvas.value.getObjects()
            allObjects.forEach(obj => {
              if (obj._annotationId === id) {
                canvas.value.remove(obj)
              }
            })
            removeAnnotation(id)
          })
        } else if (activeObj._annotationId) {
          const id = activeObj._annotationId
          const allObjects = canvas.value.getObjects()
          allObjects.forEach(obj => {
            if (obj._annotationId === id) {
              canvas.value.remove(obj)
            }
          })
          canvas.value.discardActiveObject()
          removeAnnotation(id)
        }

        canvas.value.renderAll()
        setSelectedObject(null)
      }
    }
  }
  if (e.key === 'Escape') {
    setActiveTool('select')
  }

  if (e.ctrlKey && e.shiftKey && (e.key === 'H' || e.key === 'h')) {
    e.preventDefault()
    const result = distributeHorizontal()
    if (!result) {
      ElMessage.warning('请至少选中 3 个标注框')
    } else {
      ElMessage.success('已水平等距分布')
    }
  }

  if (e.ctrlKey && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
    e.preventDefault()
    const result = distributeVertical()
    if (!result) {
      ElMessage.warning('请至少选中 3 个标注框')
    } else {
      ElMessage.success('已垂直等距分布')
    }
  }

  if (e.ctrlKey && (e.key === 'H' || e.key === 'h')) {
    e.preventDefault()
    toggleAnnotationsVisible()
    ElMessage.success(annotationsVisible.value ? '已隐藏所有标注' : '已显示所有标注')
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
.app-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
