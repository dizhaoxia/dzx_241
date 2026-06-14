import { fabric } from 'fabric'
import { useCanvasState } from './useCanvasState'
import { generateId } from '@/utils/export'

export function useRectangle() {
  const { canvas, activeTool, addAnnotation } = useCanvasState()

  let isDrawing = false
  let startX = 0
  let startY = 0
  let currentRect = null
  let mouseDownHandler = null
  let mouseMoveHandler = null
  let mouseUpHandler = null

  const initRectangle = (fabricCanvas) => {
    mouseDownHandler = (opt) => {
      if (activeTool.value !== 'rect') return
      const pointer = fabricCanvas.getPointer(opt.e)
      isDrawing = true
      startX = pointer.x
      startY = pointer.y

      currentRect = new fabric.Rect({
        left: startX,
        top: startY,
        width: 0,
        height: 0,
        fill: 'rgba(6, 182, 212, 0.15)',
        stroke: '#06b6d4',
        strokeWidth: 2,
        strokeUniform: true,
        selectable: true,
        originX: 'left',
        originY: 'top',
        cornerColor: '#06b6d4',
        cornerStyle: 'circle',
        cornerSize: 8,
        transparentCorners: false,
        borderColor: '#06b6d4',
        padding: 2,
      })

      const id = generateId()
      currentRect._annotationId = id
      currentRect._annotationType = 'rect'

      fabricCanvas.add(currentRect)
      fabricCanvas.renderAll()
    }

    mouseMoveHandler = (opt) => {
      if (!isDrawing || activeTool.value !== 'rect' || !currentRect) return
      const pointer = fabricCanvas.getPointer(opt.e)

      let width = pointer.x - startX
      let height = pointer.y - startY

      if (width < 0) {
        currentRect.set({ left: pointer.x })
        width = Math.abs(width)
      }
      if (height < 0) {
        currentRect.set({ top: pointer.y })
        height = Math.abs(height)
      }

      currentRect.set({ width, height })
      fabricCanvas.renderAll()
    }

    mouseUpHandler = () => {
      if (!isDrawing || activeTool.value !== 'rect' || !currentRect) return
      isDrawing = false

      if (currentRect.width < 5 || currentRect.height < 5) {
        fabricCanvas.remove(currentRect)
        fabricCanvas.renderAll()
        currentRect = null
        return
      }

      currentRect.setCoords()
      addAnnotation({
        id: currentRect._annotationId,
        type: 'rect',
        label: '',
        color: '#06b6d4',
        coordinates: {
          x: currentRect.left,
          y: currentRect.top,
          width: currentRect.width,
          height: currentRect.height,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      currentRect = null
      fabricCanvas.renderAll()
    }

    fabricCanvas.on('mouse:down', mouseDownHandler)
    fabricCanvas.on('mouse:move', mouseMoveHandler)
    fabricCanvas.on('mouse:up', mouseUpHandler)
  }

  const destroyRectangle = () => {
    if (canvas.value) {
      canvas.value.off('mouse:down', mouseDownHandler)
      canvas.value.off('mouse:move', mouseMoveHandler)
      canvas.value.off('mouse:up', mouseUpHandler)
    }
  }

  return { initRectangle, destroyRectangle }
}
