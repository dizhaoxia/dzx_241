import { fabric } from 'fabric'
import { watch } from 'vue'
import { useCanvasState } from './useCanvasState'
import { generateId } from '@/utils/export'

const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function usePolygon() {
  const { canvas, activeTool, addAnnotation, fillOpacity } = useCanvasState()

  let points = []
  let tempLines = []
  let tempPoints = []
  let tempCloseHint = null
  let hintText = null
  let isDrawing = false
  let lastClickTime = 0
  let lastClickPos = { x: 0, y: 0 }
  let justFinished = false
  let finishCooldownTimer = null

  const DOUBLE_CLICK_DELAY = 400
  const DOUBLE_CLICK_TOLERANCE = 15
  const CLOSE_TOLERANCE = 25
  const FINISH_COOLDOWN = 500

  let fabricCanvasRef = null
  let mouseDownHandler = null
  let mouseMoveHandler = null
  let contextMenuHandler = null
  let keyDownHandler = null
  let unwatchTool = null

  const initPolygon = (fabricCanvas) => {
    fabricCanvasRef = fabricCanvas

    unwatchTool = watch(activeTool, (newTool) => {
      if (newTool !== 'polygon' && isDrawing) {
        cancelDrawing(fabricCanvas)
      }
      updateHintVisibility(fabricCanvas, newTool === 'polygon')
    })

    keyDownHandler = (e) => {
      if (activeTool.value !== 'polygon' || !isDrawing) return
      if (e.key === 'Enter') {
        e.preventDefault()
        if (points.length >= 3) {
          finishDrawing(fabricCanvas)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancelDrawing(fabricCanvas)
      }
    }

    document.addEventListener('keydown', keyDownHandler)

    mouseDownHandler = (opt) => {
      if (activeTool.value !== 'polygon') return
      if (opt.e.button !== 0 && opt.e.button !== 2) return

      const pointer = fabricCanvas.getPointer(opt.e)
      const now = Date.now()

      if (opt.e.button === 2) {
        if (isDrawing && points.length >= 3) {
          finishDrawing(fabricCanvas)
        }
        return
      }

      if (justFinished) {
        return
      }

      const isDoubleClick = (
        now - lastClickTime < DOUBLE_CLICK_DELAY &&
        Math.abs(pointer.x - lastClickPos.x) < DOUBLE_CLICK_TOLERANCE &&
        Math.abs(pointer.y - lastClickPos.y) < DOUBLE_CLICK_TOLERANCE
      )

      lastClickTime = now
      lastClickPos = { x: pointer.x, y: pointer.y }

      if (isDoubleClick && isDrawing && points.length >= 2) {
        finishDrawing(fabricCanvas)
        return
      }

      if (isDrawing && points.length > 0) {
        const firstPoint = points[0]
        const dist = Math.sqrt(
          Math.pow(pointer.x - firstPoint.x, 2) +
          Math.pow(pointer.y - firstPoint.y, 2)
        )
        if (dist < CLOSE_TOLERANCE && points.length >= 3) {
          finishDrawing(fabricCanvas)
          return
        }
      }

      if (!isDrawing) {
        isDrawing = true
        points = [{ x: pointer.x, y: pointer.y }]
      } else {
        points.push({ x: pointer.x, y: pointer.y })
      }

      drawTempObjects(fabricCanvas)
      updateCloseHint(fabricCanvas, pointer)
      updateHintText(fabricCanvas)
      fabricCanvas.renderAll()
    }

    mouseMoveHandler = (opt) => {
      if (activeTool.value !== 'polygon' || !isDrawing || points.length === 0) return
      const pointer = fabricCanvas.getPointer(opt.e)
      updatePreviewLine(fabricCanvas, pointer)
      updateCloseHint(fabricCanvas, pointer)
      fabricCanvas.renderAll()
    }

    contextMenuHandler = (opt) => {
      if (activeTool.value === 'polygon') {
        opt.e.preventDefault()
        opt.e.stopPropagation()
      }
    }

    fabricCanvas.on('mouse:down', mouseDownHandler)
    fabricCanvas.on('mouse:move', mouseMoveHandler)
    fabricCanvas.on('contextmenu', contextMenuHandler)
  }

  const updateHintVisibility = (fabricCanvas, visible) => {
    if (visible && !hintText) {
      hintText = new fabric.Text('单击添加顶点 | 双击/右键/回车/点起点 完成', {
        left: 10,
        top: 10,
        fontSize: 12,
        fontFamily: 'system-ui, sans-serif',
        fill: '#475569',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 6,
        selectable: false,
        evented: false,
        _isHint: true,
      })
      fabricCanvas.add(hintText)
      fabricCanvas.renderAll()
    } else if (!visible && hintText) {
      fabricCanvas.remove(hintText)
      hintText = null
      fabricCanvas.renderAll()
    }
  }

  const updateHintText = (fabricCanvas) => {
    if (!hintText) return
    if (points.length >= 3) {
      hintText.set('text', `${points.length} 个顶点 | 双击/右键/回车/点起点 完成`)
    } else {
      hintText.set('text', `${points.length} 个顶点 | 至少需要 3 个点`)
    }
  }

  const drawTempObjects = (fabricCanvas) => {
    clearTempObjects(fabricCanvas)

    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      const isFirst = i === 0

      const circle = new fabric.Circle({
        left: p.x - (isFirst ? 7 : 4),
        top: p.y - (isFirst ? 7 : 4),
        radius: isFirst ? 7 : 4,
        fill: isFirst ? '#22c55e' : '#06b6d4',
        stroke: '#fff',
        strokeWidth: 2,
        selectable: false,
        evented: false,
        _isTemp: true,
      })
      fabricCanvas.add(circle)
      tempPoints.push(circle)
    }

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]
      const p2 = points[i + 1]
      const line = new fabric.Line([p1.x, p1.y, p2.x, p2.y], {
        stroke: '#06b6d4',
        strokeWidth: 2,
        selectable: false,
        evented: false,
        _isTemp: true,
      })
      fabricCanvas.add(line)
      tempLines.push(line)
    }
  }

  const updatePreviewLine = (fabricCanvas, pointer) => {
    const lastPreview = tempLines.find(l => l._isPreview)
    if (lastPreview) {
      fabricCanvas.remove(lastPreview)
      tempLines = tempLines.filter(l => l !== lastPreview)
    }

    if (points.length > 0) {
      const lastPoint = points[points.length - 1]
      const previewLine = new fabric.Line([lastPoint.x, lastPoint.y, pointer.x, pointer.y], {
        stroke: '#06b6d4',
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        _isTemp: true,
        _isPreview: true,
      })
      fabricCanvas.add(previewLine)
      tempLines.push(previewLine)
    }
  }

  const updateCloseHint = (fabricCanvas, pointer) => {
    if (tempCloseHint) {
      fabricCanvas.remove(tempCloseHint)
      tempCloseHint = null
    }

    if (isDrawing && points.length >= 3) {
      const firstPoint = points[0]
      const dist = Math.sqrt(
        Math.pow(pointer.x - firstPoint.x, 2) +
        Math.pow(pointer.y - firstPoint.y, 2)
      )
      if (dist < CLOSE_TOLERANCE) {
        tempCloseHint = new fabric.Circle({
          left: firstPoint.x - 12,
          top: firstPoint.y - 12,
          radius: 12,
          fill: 'rgba(34, 197, 94, 0.25)',
          stroke: '#22c55e',
          strokeWidth: 2,
          selectable: false,
          evented: false,
          _isTemp: true,
        })
        fabricCanvas.add(tempCloseHint)
      }
    }
  }

  const clearTempObjects = (fabricCanvas) => {
    tempPoints.forEach(p => fabricCanvas.remove(p))
    tempLines.forEach(l => fabricCanvas.remove(l))
    if (tempCloseHint) {
      fabricCanvas.remove(tempCloseHint)
      tempCloseHint = null
    }
    tempPoints = []
    tempLines = []
  }

  const cancelDrawing = (fabricCanvas) => {
    clearTempObjects(fabricCanvas)
    isDrawing = false
    points = []
    lastClickTime = 0
    lastClickPos = { x: 0, y: 0 }
    justFinished = false
    if (finishCooldownTimer) {
      clearTimeout(finishCooldownTimer)
      finishCooldownTimer = null
    }
    updateHintText(fabricCanvas)
    fabricCanvas.renderAll()
  }

  const finishDrawing = (fabricCanvas) => {
    clearTempObjects(fabricCanvas)

    const polygonPoints = points.map(p => ({ x: p.x, y: p.y }))
    const id = generateId()

    const polygon = new fabric.Polygon(polygonPoints, {
      fill: hexToRgba('#06b6d4', fillOpacity.value),
      stroke: '#06b6d4',
      strokeWidth: 2,
      strokeUniform: true,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      cornerColor: '#06b6d4',
      cornerStyle: 'circle',
      cornerSize: 8,
      transparentCorners: false,
      borderColor: '#06b6d4',
      padding: 2,
      perPixelTargetFind: false,
    })

    polygon.set('_annotationId', id)
    polygon.set('_annotationType', 'polygon')
    polygon.set('_isAnnotation', true)
    polygon.set('_polygonPoints', polygonPoints)

    fabricCanvas.add(polygon)
    polygon.setCoords()
    fabricCanvas.setActiveObject(polygon)
    fabricCanvas.renderAll()

    const bounds = polygon.getBoundingRect()
    addAnnotation({
      id,
      type: 'polygon',
      label: '',
      color: '#06b6d4',
      coordinates: {
        points: polygonPoints,
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    isDrawing = false
    points = []
    lastClickTime = 0
    lastClickPos = { x: 0, y: 0 }

    updateHintText(fabricCanvas)

    justFinished = true
    if (finishCooldownTimer) clearTimeout(finishCooldownTimer)
    finishCooldownTimer = setTimeout(() => {
      justFinished = false
      finishCooldownTimer = null
    }, FINISH_COOLDOWN)
  }

  const destroyPolygon = () => {
    if (unwatchTool) {
      unwatchTool()
      unwatchTool = null
    }
    if (keyDownHandler) {
      document.removeEventListener('keydown', keyDownHandler)
      keyDownHandler = null
    }
    if (finishCooldownTimer) {
      clearTimeout(finishCooldownTimer)
      finishCooldownTimer = null
    }
    if (hintText && fabricCanvasRef) {
      fabricCanvasRef.remove(hintText)
      hintText = null
    }
    if (fabricCanvasRef) {
      fabricCanvasRef.off('mouse:down', mouseDownHandler)
      fabricCanvasRef.off('mouse:move', mouseMoveHandler)
      fabricCanvasRef.off('contextmenu', contextMenuHandler)
    }
    fabricCanvasRef = null
  }

  return { initPolygon, destroyPolygon }
}
