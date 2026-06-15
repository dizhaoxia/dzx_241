import { watch } from 'vue'
import { fabric } from 'fabric'
import { useCanvasState } from './useCanvasState'

export function useAnnotationDisplay() {
  const { canvas, annotationsVisible, fillOpacity, toggleAnnotationsVisible, setFillOpacity } = useCanvasState()

  let fabricCanvasRef = null
  let unwatchVisible = null
  let unwatchOpacity = null

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const getAnnotationObjects = () => {
    if (!fabricCanvasRef) return []
    return fabricCanvasRef.getObjects().filter(
      (obj) => obj._isAnnotation && !obj._isGuideLine && !obj._isHint && !obj._isTemp && !obj._isVertexHandle && !obj._isMidpointHandle
    )
  }

  const updateAnnotationsVisibility = (visible) => {
    if (!fabricCanvasRef) return
    const objects = getAnnotationObjects()
    objects.forEach((obj) => {
      obj.set('visible', visible)
      obj.set('evented', visible)
      if (obj._labelObj) {
        obj._labelObj.set('visible', visible)
        obj._labelObj.set('evented', visible)
      }
    })
    if (!visible) {
      fabricCanvasRef.discardActiveObject()
    }
    fabricCanvasRef.renderAll()
  }

  const updateFillOpacity = (opacity) => {
    if (!fabricCanvasRef) return
    const objects = getAnnotationObjects()
    objects.forEach((obj) => {
      if (obj._annotationType === 'rect' || obj._annotationType === 'polygon') {
        const strokeColor = obj.stroke || '#06b6d4'
        obj.set('fill', hexToRgba(strokeColor, opacity))
        obj.setCoords()
      }
    })
    fabricCanvasRef.renderAll()
  }

  const initAnnotationDisplay = (fabricCanvas) => {
    fabricCanvasRef = fabricCanvas

    unwatchVisible = watch(annotationsVisible, (newVal) => {
      updateAnnotationsVisibility(newVal)
    }, { immediate: true })

    unwatchOpacity = watch(fillOpacity, (newVal) => {
      updateFillOpacity(newVal)
    }, { immediate: false })
  }

  const destroyAnnotationDisplay = () => {
    if (unwatchVisible) {
      unwatchVisible()
      unwatchVisible = null
    }
    if (unwatchOpacity) {
      unwatchOpacity()
      unwatchOpacity = null
    }
    fabricCanvasRef = null
  }

  return {
    initAnnotationDisplay,
    destroyAnnotationDisplay,
    updateAnnotationsVisibility,
    updateFillOpacity,
    hexToRgba,
    toggleAnnotationsVisible,
    setFillOpacity,
  }
}
