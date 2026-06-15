import { fabric } from 'fabric'
import { watch } from 'vue'
import { useCanvasState } from './useCanvasState'

const VERTEX_RADIUS = 6
const VERTEX_FILL = '#06b6d4'
const VERTEX_STROKE = '#ffffff'
const MIDPOINT_RADIUS = 4
const MIDPOINT_FILL = '#22c55e'
const MIDPOINT_STROKE = '#ffffff'

export function usePolygonEdit() {
  const { canvas, setActiveTool, annotationsVisible } = useCanvasState()

  let unwatchVisible = null

  let fabricCanvasRef = null
  let editingPolygon = null
  let vertexHandles = []
  let midpointHandles = []
  let editingHintText = null
  let isDraggingVertex = false
  let draggingVertexIndex = -1

  let mouseDownHandler = null
  let mouseMoveHandler = null
  let mouseUpHandler = null
  let contextMenuHandler = null
  let keyDownHandler = null
  let dblClickHandler = null
  let selectionHandler = null

  const clearEditHandles = () => {
    if (!fabricCanvasRef) return
    vertexHandles.forEach(h => fabricCanvasRef.remove(h))
    midpointHandles.forEach(h => fabricCanvasRef.remove(h))
    vertexHandles = []
    midpointHandles = []
    if (editingHintText) {
      fabricCanvasRef.remove(editingHintText)
      editingHintText = null
    }
  }

  const exitEditMode = () => {
    if (!editingPolygon) return

    if (fabricCanvasRef) {
      fabricCanvasRef.setActiveObject(editingPolygon)
      editingPolygon.set('selectable', true)
      editingPolygon.set('evented', true)
      editingPolygon.set('hasControls', true)
      editingPolygon.set('hasBorders', true)
    }

    clearEditHandles()
    editingPolygon = null
    isDraggingVertex = false
    draggingVertexIndex = -1

    if (fabricCanvasRef) {
      fabricCanvasRef.renderAll()
    }
  }

  const getPolygonAbsolutePoints = (polygon) => {
    const points = polygon.points || []
    return points.map(p => {
      return {
        x: p.x * (polygon.scaleX || 1) + polygon.left,
        y: p.y * (polygon.scaleY || 1) + polygon.top
      }
    })
  }

  const updatePolygonFromAbsolutePoints = (polygon, absolutePoints) => {
    const minX = Math.min(...absolutePoints.map(p => p.x))
    const minY = Math.min(...absolutePoints.map(p => p.y))
    const maxX = Math.max(...absolutePoints.map(p => p.x))
    const maxY = Math.max(...absolutePoints.map(p => p.y))

    const newPoints = absolutePoints.map(p => ({
      x: p.x - minX,
      y: p.y - minY
    }))

    polygon.set({
      points: newPoints,
      left: minX,
      top: minY,
      scaleX: 1,
      scaleY: 1
    })
    polygon.set('_polygonPoints', newPoints)
    polygon.setCoords()
  }

  const createVertexHandle = (x, y, index) => {
    const circle = new fabric.Circle({
      left: x - VERTEX_RADIUS,
      top: y - VERTEX_RADIUS,
      radius: VERTEX_RADIUS,
      fill: VERTEX_FILL,
      stroke: VERTEX_STROKE,
      strokeWidth: 2,
      selectable: false,
      hasControls: false,
      hasBorders: false,
      _isVertexHandle: true,
      _vertexIndex: index
    })
    return circle
  }

  const createMidpointHandle = (x, y, edgeIndex) => {
    const circle = new fabric.Circle({
      left: x - MIDPOINT_RADIUS,
      top: y - MIDPOINT_RADIUS,
      radius: MIDPOINT_RADIUS,
      fill: MIDPOINT_FILL,
      stroke: MIDPOINT_STROKE,
      strokeWidth: 1.5,
      selectable: false,
      hasControls: false,
      hasBorders: false,
      _isMidpointHandle: true,
      _edgeIndex: edgeIndex
    })
    return circle
  }

  const renderEditHandles = () => {
    if (!fabricCanvasRef || !editingPolygon) return

    clearEditHandles()

    const points = getPolygonAbsolutePoints(editingPolygon)
    const len = points.length

    editingHintText = new fabric.Text(`编辑模式 | ${len} 顶点 | 拖点改形 | 点绿点加顶点 | 右键删点 | Esc退出`, {
      left: 10,
      top: 10,
      fontSize: 12,
      fontFamily: 'system-ui, sans-serif',
      fill: '#475569',
      backgroundColor: 'rgba(34, 197, 94, 0.12)',
      padding: 6,
      selectable: false,
      evented: false,
      _isHint: true
    })
    fabricCanvasRef.add(editingHintText)

    points.forEach((p, i) => {
      const handle = createVertexHandle(p.x, p.y, i)
      fabricCanvasRef.add(handle)
      vertexHandles.push(handle)
    })

    for (let i = 0; i < len; i++) {
      const p1 = points[i]
      const p2 = points[(i + 1) % len]
      const mx = (p1.x + p2.x) / 2
      const my = (p1.y + p2.y) / 2
      const handle = createMidpointHandle(mx, my, i)
      fabricCanvasRef.add(handle)
      midpointHandles.push(handle)
    }

    fabricCanvasRef.renderAll()
  }

  const enterEditMode = (polygon) => {
    if (!fabricCanvasRef) return
    if (polygon._annotationType !== 'polygon') return

    if (editingPolygon && editingPolygon !== polygon) {
      exitEditMode()
    }

    editingPolygon = polygon
    fabricCanvasRef.discardActiveObject()
    polygon.set('selectable', false)
    polygon.set('evented', false)
    polygon.set('hasControls', false)
    polygon.set('hasBorders', false)

    renderEditHandles()
  }

  const addVertexAtEdge = (edgeIndex, pointer) => {
    if (!editingPolygon) return

    const points = getPolygonAbsolutePoints(editingPolygon)
    const len = points.length

    const newPoints = [...points]
    const insertIndex = (edgeIndex + 1) % len
    newPoints.splice(insertIndex, 0, { x: pointer.x, y: pointer.y })

    updatePolygonFromAbsolutePoints(editingPolygon, newPoints)
    renderEditHandles()
  }

  const deleteVertex = (vertexIndex) => {
    if (!editingPolygon) return

    const points = getPolygonAbsolutePoints(editingPolygon)
    if (points.length <= 3) return

    const newPoints = points.filter((_, i) => i !== vertexIndex)
    updatePolygonFromAbsolutePoints(editingPolygon, newPoints)
    renderEditHandles()
  }

  const handlePointerDown = (opt) => {
    if (!editingPolygon || !opt.target) return

    const target = opt.target

    if (target._isVertexHandle) {
      if (opt.e.button === 2) {
        opt.e.preventDefault()
        opt.e.stopPropagation()
        deleteVertex(target._vertexIndex)
        return
      }

      isDraggingVertex = true
      draggingVertexIndex = target._vertexIndex
      opt.e.preventDefault()
      opt.e.stopPropagation()
    } else if (target._isMidpointHandle) {
      const pointer = fabricCanvasRef.getPointer(opt.e)
      addVertexAtEdge(target._edgeIndex, pointer)
      opt.e.preventDefault()
      opt.e.stopPropagation()
    }
  }

  const handlePointerMove = (opt) => {
    if (!editingPolygon || !isDraggingVertex || draggingVertexIndex < 0) return

    const pointer = fabricCanvasRef.getPointer(opt.e)
    const points = getPolygonAbsolutePoints(editingPolygon)
    points[draggingVertexIndex] = { x: pointer.x, y: pointer.y }

    updatePolygonFromAbsolutePoints(editingPolygon, points)
    renderEditHandles()
  }

  const handlePointerUp = () => {
    isDraggingVertex = false
    draggingVertexIndex = -1
  }

  const handleContextMenu = (opt) => {
    if (!editingPolygon) return
    if (opt.target && (opt.target._isVertexHandle || opt.target._isMidpointHandle || opt.target === editingPolygon)) {
      opt.e.preventDefault()
      opt.e.stopPropagation()
    }
  }

  const handleKeyDown = (e) => {
    if (!editingPolygon) return

    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      if (e.stopImmediatePropagation) e.stopImmediatePropagation()
      exitEditMode()
    }
  }

  const handleDblClick = (opt) => {
    if (!fabricCanvasRef) return
    const target = opt.target
    if (target && target._annotationType === 'polygon' && !editingPolygon) {
      opt.e.preventDefault()
      enterEditMode(target)
    }
  }

  const handleSelectionCreated = () => {
    if (editingPolygon) {
      exitEditMode()
    }
  }

  const initPolygonEdit = (fabricCanvas) => {
    fabricCanvasRef = fabricCanvas

    dblClickHandler = handleDblClick
    mouseDownHandler = handlePointerDown
    mouseMoveHandler = handlePointerMove
    mouseUpHandler = handlePointerUp
    contextMenuHandler = handleContextMenu
    keyDownHandler = handleKeyDown
    selectionHandler = handleSelectionCreated

    fabricCanvas.on('mouse:dblclick', dblClickHandler)
    fabricCanvas.on('mouse:down', mouseDownHandler)
    fabricCanvas.on('mouse:move', mouseMoveHandler)
    fabricCanvas.on('mouse:up', mouseUpHandler)
    fabricCanvas.on('contextmenu', contextMenuHandler)
    fabricCanvas.on('selection:created', selectionHandler)

    document.addEventListener('keydown', keyDownHandler, true)

    unwatchVisible = watch(annotationsVisible, (newVal) => {
      if (!newVal && editingPolygon) {
        exitEditMode()
      }
    })
  }

  const destroyPolygonEdit = () => {
    if (unwatchVisible) {
      unwatchVisible()
      unwatchVisible = null
    }

    if (fabricCanvasRef) {
      if (dblClickHandler) fabricCanvasRef.off('mouse:dblclick', dblClickHandler)
      if (mouseDownHandler) fabricCanvasRef.off('mouse:down', mouseDownHandler)
      if (mouseMoveHandler) fabricCanvasRef.off('mouse:move', mouseMoveHandler)
      if (mouseUpHandler) fabricCanvasRef.off('mouse:up', mouseUpHandler)
      if (contextMenuHandler) fabricCanvasRef.off('contextmenu', contextMenuHandler)
      if (selectionHandler) fabricCanvasRef.off('selection:created', selectionHandler)
    }
    if (keyDownHandler) {
      document.removeEventListener('keydown', keyDownHandler, true)
    }

    clearEditHandles()
    editingPolygon = null
    fabricCanvasRef = null
    isDraggingVertex = false
    draggingVertexIndex = -1
  }

  return {
    initPolygonEdit,
    destroyPolygonEdit,
    enterEditMode,
    exitEditMode
  }
}
