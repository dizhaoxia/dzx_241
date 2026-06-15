import { fabric } from 'fabric'
import { useCanvasState } from './useCanvasState'

const SNAP_THRESHOLD = 8
const GUIDE_LINE_COLOR = '#ef4444'
const GUIDE_LINE_DASH = [6, 4]
const GUIDE_LINE_WIDTH = 1

export function useSnapAlignment() {
  const { canvas } = useCanvasState()

  let fabricCanvasRef = null
  let guideLines = []
  let isMoving = false

  const movingHandler = (opt) => {
    if (!fabricCanvasRef) return
    const target = opt.target
    if (!target || !target._isAnnotation) return

    isMoving = true
    clearGuideLines()

    const targetBounds = getObjectBounds(target)
    const otherObjects = getOtherAnnotationObjects(target)
    const canvasWidth = fabricCanvasRef.getWidth()
    const canvasHeight = fabricCanvasRef.getHeight()

    let snapX = null
    let snapY = null
    const guideLineData = []

    for (const other of otherObjects) {
      const otherBounds = getObjectBounds(other)

      const edgeResult = checkEdgeSnap(targetBounds, otherBounds)
      if (edgeResult.snapX !== null && snapX === null) {
        snapX = edgeResult.snapX
        guideLineData.push(...edgeResult.guides)
      } else if (edgeResult.snapX !== null && snapX !== null) {
        guideLineData.push(...edgeResult.guides)
      }
      if (edgeResult.snapY !== null && snapY === null) {
        snapY = edgeResult.snapY
        guideLineData.push(...edgeResult.guides)
      } else if (edgeResult.snapY !== null && snapY !== null) {
        guideLineData.push(...edgeResult.guides)
      }

      const centerResult = checkCenterSnap(targetBounds, otherBounds)
      if (centerResult.snapX !== null && snapX === null) {
        snapX = centerResult.snapX
        guideLineData.push(...centerResult.guides)
      } else if (centerResult.snapX !== null && snapX !== null) {
        guideLineData.push(...centerResult.guides)
      }
      if (centerResult.snapY !== null && snapY === null) {
        snapY = centerResult.snapY
        guideLineData.push(...centerResult.guides)
      } else if (centerResult.snapY !== null && snapY !== null) {
        guideLineData.push(...centerResult.guides)
      }
    }

    const canvasResult = checkCanvasEdgeSnap(targetBounds, canvasWidth, canvasHeight)
    if (canvasResult.snapX !== null) snapX = canvasResult.snapX
    if (canvasResult.snapY !== null) snapY = canvasResult.snapY
    guideLineData.push(...canvasResult.guides)

    if (snapX !== null) {
      applySnapX(target, snapX)
    }
    if (snapY !== null) {
      applySnapY(target, snapY)
    }

    if (guideLineData.length > 0) {
      drawGuideLines(guideLineData)
    }
  }

  const movedHandler = () => {
    isMoving = false
    clearGuideLines()
  }

  const getObjectBounds = (obj) => {
    const rect = obj.getBoundingRect()
    return {
      left: rect.left,
      right: rect.left + rect.width,
      top: rect.top,
      bottom: rect.top + rect.height,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
    }
  }

  const getOtherAnnotationObjects = (excludeObj) => {
    if (!fabricCanvasRef) return []
    const all = fabricCanvasRef.getObjects()
    return all.filter(
      (o) =>
        o._isAnnotation &&
        o !== excludeObj &&
        o !== excludeObj._labelObj &&
        !(excludeObj.type === 'activeSelection' && excludeObj.contains(o))
    )
  }

  const checkEdgeSnap = (target, other) => {
    let snapX = null
    let snapY = null
    const guides = []

    const leftLeft = Math.abs(target.left - other.left)
    const leftRight = Math.abs(target.left - other.right)
    const rightLeft = Math.abs(target.right - other.left)
    const rightRight = Math.abs(target.right - other.right)

    if (leftLeft <= SNAP_THRESHOLD) {
      snapX = other.left
      guides.push({ type: 'v', position: other.left, range: [Math.min(target.top, other.top), Math.max(target.bottom, other.bottom)] })
    } else if (leftRight <= SNAP_THRESHOLD) {
      snapX = other.right
      guides.push({ type: 'v', position: other.right, range: [Math.min(target.top, other.top), Math.max(target.bottom, other.bottom)] })
    }
    if (rightRight <= SNAP_THRESHOLD && (snapX === null || Math.abs(target.right - other.right) < Math.abs(target.right - (snapX + target.width)))) {
      snapX = other.right - target.width
      if (guides.length === 0 || guides[guides.length - 1].position !== other.right) {
        guides.push({ type: 'v', position: other.right, range: [Math.min(target.top, other.top), Math.max(target.bottom, other.bottom)] })
      }
    }
    if (rightLeft <= SNAP_THRESHOLD && (snapX === null || Math.abs(target.right - other.left) < Math.abs(target.left - snapX))) {
      snapX = other.left - target.width
      if (guides.length === 0 || guides[guides.length - 1].position !== other.left) {
        guides.push({ type: 'v', position: other.left, range: [Math.min(target.top, other.top), Math.max(target.bottom, other.bottom)] })
      }
    }

    const topTop = Math.abs(target.top - other.top)
    const topBottom = Math.abs(target.top - other.bottom)
    const bottomTop = Math.abs(target.bottom - other.top)
    const bottomBottom = Math.abs(target.bottom - other.bottom)

    if (topTop <= SNAP_THRESHOLD) {
      snapY = other.top
      guides.push({ type: 'h', position: other.top, range: [Math.min(target.left, other.left), Math.max(target.right, other.right)] })
    } else if (topBottom <= SNAP_THRESHOLD) {
      snapY = other.bottom
      guides.push({ type: 'h', position: other.bottom, range: [Math.min(target.left, other.left), Math.max(target.right, other.right)] })
    }
    if (bottomBottom <= SNAP_THRESHOLD && (snapY === null || Math.abs(target.bottom - other.bottom) < Math.abs(target.bottom - (snapY + target.height)))) {
      snapY = other.bottom - target.height
      if (guides.length === 0 || guides[guides.length - 1].position !== other.bottom) {
        guides.push({ type: 'h', position: other.bottom, range: [Math.min(target.left, other.left), Math.max(target.right, other.right)] })
      }
    }
    if (bottomTop <= SNAP_THRESHOLD && (snapY === null || Math.abs(target.bottom - other.top) < Math.abs(target.top - snapY))) {
      snapY = other.top - target.height
      if (guides.length === 0 || guides[guides.length - 1].position !== other.top) {
        guides.push({ type: 'h', position: other.top, range: [Math.min(target.left, other.left), Math.max(target.right, other.right)] })
      }
    }

    return { snapX, snapY, guides }
  }

  const checkCenterSnap = (target, other) => {
    let snapX = null
    let snapY = null
    const guides = []

    const centerXDiff = Math.abs(target.centerX - other.centerX)
    if (centerXDiff <= SNAP_THRESHOLD) {
      snapX = other.centerX - target.width / 2
      guides.push({
        type: 'v',
        position: other.centerX,
        range: [Math.min(target.top, other.top), Math.max(target.bottom, other.bottom)],
      })
    }

    const centerYDiff = Math.abs(target.centerY - other.centerY)
    if (centerYDiff <= SNAP_THRESHOLD) {
      snapY = other.centerY - target.height / 2
      guides.push({
        type: 'h',
        position: other.centerY,
        range: [Math.min(target.left, other.left), Math.max(target.right, other.right)],
      })
    }

    return { snapX, snapY, guides }
  }

  const checkCanvasEdgeSnap = (target, canvasWidth, canvasHeight) => {
    let snapX = null
    let snapY = null
    const guides = []

    if (target.left <= SNAP_THRESHOLD && target.left > 0) {
      snapX = 0
      guides.push({ type: 'v', position: 0, range: [target.top, target.bottom] })
    }
    if (target.right >= canvasWidth - SNAP_THRESHOLD && target.right < canvasWidth) {
      snapX = canvasWidth - target.width
      guides.push({ type: 'v', position: canvasWidth, range: [target.top, target.bottom] })
    }
    if (target.top <= SNAP_THRESHOLD && target.top > 0) {
      snapY = 0
      guides.push({ type: 'h', position: 0, range: [target.left, target.right] })
    }
    if (target.bottom >= canvasHeight - SNAP_THRESHOLD && target.bottom < canvasHeight) {
      snapY = canvasHeight - target.height
      guides.push({ type: 'h', position: canvasHeight, range: [target.left, target.right] })
    }

    return { snapX, snapY, guides }
  }

  const applySnapX = (obj, newLeft) => {
    if (obj.type === 'polygon') {
      const bounds = obj.getBoundingRect()
      const deltaX = newLeft - bounds.left
      obj.set('left', obj.left + deltaX)
    } else if (obj.type === 'activeSelection') {
      const bounds = obj.getBoundingRect()
      const deltaX = newLeft - bounds.left
      obj.set('left', obj.left + deltaX)
    } else {
      obj.set('left', newLeft)
    }
    obj.setCoords()
  }

  const applySnapY = (obj, newTop) => {
    if (obj.type === 'polygon') {
      const bounds = obj.getBoundingRect()
      const deltaY = newTop - bounds.top
      obj.set('top', obj.top + deltaY)
    } else if (obj.type === 'activeSelection') {
      const bounds = obj.getBoundingRect()
      const deltaY = newTop - bounds.top
      obj.set('top', obj.top + deltaY)
    } else {
      obj.set('top', newTop)
    }
    obj.setCoords()
  }

  const drawGuideLines = (guideData) => {
    if (!fabricCanvasRef) return

    for (const data of guideData) {
      let line
      if (data.type === 'v') {
        line = new fabric.Line([data.position, data.range[0], data.position, data.range[1]], {
          stroke: GUIDE_LINE_COLOR,
          strokeWidth: GUIDE_LINE_WIDTH,
          strokeDashArray: GUIDE_LINE_DASH,
          selectable: false,
          evented: false,
          excludeFromExport: true,
          _isGuideLine: true,
        })
      } else {
        line = new fabric.Line([data.range[0], data.position, data.range[1], data.position], {
          stroke: GUIDE_LINE_COLOR,
          strokeWidth: GUIDE_LINE_WIDTH,
          strokeDashArray: GUIDE_LINE_DASH,
          selectable: false,
          evented: false,
          excludeFromExport: true,
          _isGuideLine: true,
        })
      }
      fabricCanvasRef.add(line)
      guideLines.push(line)
    }
    fabricCanvasRef.renderAll()
  }

  const clearGuideLines = () => {
    if (!fabricCanvasRef) return
    for (const line of guideLines) {
      fabricCanvasRef.remove(line)
    }
    guideLines = []
  }

  const getSelectedAnnotationObjects = () => {
    if (!fabricCanvasRef) return []
    const activeObj = fabricCanvasRef.getActiveObject()
    if (!activeObj) return []

    let selectedObjects = []

    if (activeObj.type === 'activeSelection') {
      selectedObjects = activeObj.getObjects()
    } else {
      selectedObjects = [activeObj]
    }

    const mainObjects = selectedObjects.filter((o) => o._isAnnotation && o._annotationType !== 'label')

    return mainObjects
  }

  const distributeHorizontal = () => {
    if (!fabricCanvasRef) return false
    const objects = getSelectedAnnotationObjects()

    if (objects.length < 3) return false

    const sorted = objects
      .map((o) => ({ obj: o, bounds: getObjectBounds(o) }))
      .sort((a, b) => a.bounds.left - b.bounds.left)

    const leftMost = sorted[0].bounds.left
    const rightMost = sorted[sorted.length - 1].bounds.right
    const totalWidth = rightMost - leftMost

    const totalObjWidth = sorted.reduce((sum, s) => sum + s.bounds.width, 0)
    const availableSpace = totalWidth - totalObjWidth
    const gap = availableSpace / (sorted.length - 1)

    let currentLeft = leftMost
    for (let i = 0; i < sorted.length; i++) {
      const { obj, bounds } = sorted[i]
      if (i === 0) {
        currentLeft += bounds.width + gap
        continue
      }
      if (i === sorted.length - 1) {
        break
      }
      const deltaX = currentLeft - bounds.left
      const labelObj = findAssociatedLabel(obj)

      obj.set('left', obj.left + deltaX)
      obj.setCoords()
      if (labelObj) {
        labelObj.set('left', labelObj.left + deltaX)
        labelObj.setCoords()
      }
      currentLeft += bounds.width + gap
    }

    fabricCanvasRef.renderAll()
    return true
  }

  const distributeVertical = () => {
    if (!fabricCanvasRef) return false
    const objects = getSelectedAnnotationObjects()

    if (objects.length < 3) return false

    const sorted = objects
      .map((o) => ({ obj: o, bounds: getObjectBounds(o) }))
      .sort((a, b) => a.bounds.top - b.bounds.top)

    const topMost = sorted[0].bounds.top
    const bottomMost = sorted[sorted.length - 1].bounds.bottom
    const totalHeight = bottomMost - topMost

    const totalObjHeight = sorted.reduce((sum, s) => sum + s.bounds.height, 0)
    const availableSpace = totalHeight - totalObjHeight
    const gap = availableSpace / (sorted.length - 1)

    let currentTop = topMost
    for (let i = 0; i < sorted.length; i++) {
      const { obj, bounds } = sorted[i]
      if (i === 0) {
        currentTop += bounds.height + gap
        continue
      }
      if (i === sorted.length - 1) {
        break
      }
      const deltaY = currentTop - bounds.top
      const labelObj = findAssociatedLabel(obj)

      obj.set('top', obj.top + deltaY)
      obj.setCoords()
      if (labelObj) {
        labelObj.set('top', labelObj.top + deltaY)
        labelObj.setCoords()
      }
      currentTop += bounds.height + gap
    }

    fabricCanvasRef.renderAll()
    return true
  }

  const findAssociatedLabel = (mainObj) => {
    if (!fabricCanvasRef || !mainObj._annotationId) return null
    const allObjects = fabricCanvasRef.getObjects()
    return allObjects.find(
      (o) => o._annotationId === mainObj._annotationId && o._annotationType === 'label' && o !== mainObj
    ) || null
  }

  const initSnapAlignment = (fabricCanvas) => {
    fabricCanvasRef = fabricCanvas

    fabricCanvas.on('object:moving', movingHandler)
    fabricCanvas.on('object:moved', movedHandler)
    fabricCanvas.on('mouse:up', movedHandler)
    fabricCanvas.on('selection:cleared', movedHandler)
  }

  const destroySnapAlignment = () => {
    if (fabricCanvasRef) {
      fabricCanvasRef.off('object:moving', movingHandler)
      fabricCanvasRef.off('object:moved', movedHandler)
      fabricCanvasRef.off('mouse:up', movedHandler)
      fabricCanvasRef.off('selection:cleared', movedHandler)
      clearGuideLines()
    }
    fabricCanvasRef = null
  }

  return {
    initSnapAlignment,
    destroySnapAlignment,
    distributeHorizontal,
    distributeVertical,
    SNAP_THRESHOLD,
  }
}
