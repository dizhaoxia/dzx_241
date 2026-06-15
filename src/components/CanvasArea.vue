<template>
  <div class="canvas-wrapper" ref="wrapperRef">
    <div class="canvas-inner" v-if="!imageLoaded" @click="triggerUpload">
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <p class="empty-title">点击上传图片或拖拽到此处</p>
        <p class="empty-hint">支持 JPG、PNG 格式</p>
      </div>
    </div>
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { fabric } from 'fabric'
import { useCanvasState } from '../composables/useCanvasState'
import { useRectangle } from '../composables/useRectangle'
import { usePolygon } from '../composables/usePolygon'
import { useTextTool } from '../composables/useTextTool'
import { useCanvasZoom } from '../composables/useCanvasZoom'
import { useSnapAlignment } from '../composables/useSnapAlignment'

const canvasRef = ref(null)
const wrapperRef = ref(null)
const { imageLoaded, setCanvas, setSelectedObject, setImageLoaded, setActiveTool, activeTool, canvas, annotations, setLoadImageFn, setDistributeHorizontalFn, setDistributeVerticalFn } = useCanvasState()

const { initRectangle, destroyRectangle } = useRectangle()
const { initPolygon, destroyPolygon } = usePolygon()
const { initTextTool, destroyTextTool } = useTextTool()
const { initZoom, destroyZoom } = useCanvasZoom()
const { initSnapAlignment, destroySnapAlignment, distributeHorizontal, distributeVertical } = useSnapAlignment()

let backgroundImage = null
let dragOverHandler = null
let dropHandler = null

const initCanvas = () => {
  const el = canvasRef.value
  const wrapper = wrapperRef.value
  if (!el || !wrapper) return

  const width = wrapper.clientWidth
  const height = wrapper.clientHeight

  const fabricCanvas = new fabric.Canvas(el, {
    width,
    height,
    backgroundColor: '#f8fafc',
    selection: true,
    preserveObjectStacking: true,
  })

  fabricCanvas.on('selection:created', (e) => {
    if (e.selected && e.selected.length > 0 && e.selected[0]._annotationId) {
      setSelectedObject(e.selected[0])
    }
  })

  fabricCanvas.on('selection:updated', (e) => {
    if (e.selected && e.selected.length > 0 && e.selected[0]._annotationId) {
      setSelectedObject(e.selected[0])
    }
  })

  fabricCanvas.on('selection:cleared', () => {
    setSelectedObject(null)
  })

  fabricCanvas.on('object:modified', (e) => {
    if (e.target && e.target._annotationId) {
      e.target.setCoords()
      fabricCanvas.renderAll()
    }
  })

  setCanvas(fabricCanvas)
  window._fabricCanvas = fabricCanvas
  initRectangle(fabricCanvas)
  initPolygon(fabricCanvas)
  initTextTool(fabricCanvas)
  initZoom(fabricCanvas)
  initSnapAlignment(fabricCanvas)
  setDistributeHorizontalFn(distributeHorizontal)
  setDistributeVerticalFn(distributeVertical)

  setLoadImageFn(loadImageToCanvas)
}

const handleResize = () => {
  if (!canvas.value || !wrapperRef.value) return
  const width = wrapperRef.value.clientWidth
  const height = wrapperRef.value.clientHeight
  canvas.value.setDimensions({ width, height })
  canvas.value.renderAll()
}

const triggerUpload = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.jpg,.jpeg,.png'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) loadImageToCanvas(file)
  }
  input.click()
}

const loadImageToCanvas = (file) => {
  if (!canvas.value) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target.result
    fabric.Image.fromURL(dataUrl, (img) => {
      const canvasWidth = canvas.value.getWidth()
      const canvasHeight = canvas.value.getHeight()
      const scaleX = (canvasWidth * 0.9) / img.width
      const scaleY = (canvasHeight * 0.9) / img.height
      const scale = Math.min(scaleX, scaleY, 1)

      img.set({
        left: (canvasWidth - img.width * scale) / 2,
        top: (canvasHeight - img.height * scale) / 2,
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
        _isBackground: true,
      })

      if (backgroundImage) {
        canvas.value.remove(backgroundImage)
      }

      backgroundImage = img
      canvas.value.add(img)
      canvas.value.sendToBack(img)
      canvas.value.renderAll()
      setImageLoaded(true)
    })
  }
  reader.readAsDataURL(file)
}

onMounted(() => {
  nextTick(() => {
    initCanvas()
  })

  window.addEventListener('resize', handleResize)

  dragOverHandler = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  dropHandler = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (file && /\.(jpg|jpeg|png)$/i.test(file.name)) {
      loadImageToCanvas(file)
    }
  }

  const wrapper = wrapperRef.value
  if (wrapper) {
    wrapper.addEventListener('dragover', dragOverHandler)
    wrapper.addEventListener('drop', dropHandler)
  }
})

onBeforeUnmount(() => {
  destroyRectangle()
  destroyPolygon()
  destroyTextTool()
  destroyZoom()
  destroySnapAlignment()
  window.removeEventListener('resize', handleResize)

  const wrapper = wrapperRef.value
  if (wrapper) {
    wrapper.removeEventListener('dragover', dragOverHandler)
    wrapper.removeEventListener('drop', dropHandler)
  }

  if (canvas.value) {
    canvas.value.dispose()
  }
})
</script>

<style scoped>
.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
    linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  background-color: #f1f5f9;
}

.canvas-inner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  cursor: pointer;
  transition: background 0.2s ease;
}

.canvas-inner:hover {
  background: rgba(6, 182, 212, 0.03);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
}

.empty-title {
  font-size: 14px;
  font-weight: 500;
}

.empty-hint {
  font-size: 12px;
  opacity: 0.7;
}

:deep(.canvas-container) {
  margin: 0 auto;
}
</style>
