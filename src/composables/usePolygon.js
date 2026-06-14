import { fabric } from 'fabric'
import { useCanvasState } from './useCanvasState'
import { generateId } from '@/utils/export'

export function usePolygon() {
  const { canvas, activeTool, addAnnotation } = useCanvasState()

  let points = []
  let polygon = null
  let tempPoints = []
  let tempLines = []
  let isDrawing = false
  let mouseDownHandler = null
  let mouseMoveHandler = null
  let mouseDblClickHandler = null

  const initPolygon = (fabricCanvas) => {
    mouseDownHandler = (opt) => {
      if (activeTool.value !== 'polygon') return
      if (opt.e.button !== 0) return

      const pointer = fabricCanvas.getPointer(opt.e)

      if (!isDrawing) {
        isDrawing = true
        points = [{ x: pointer.x, y: pointer.y }]

        const startCircle = new fabric.Circle({
          left: pointer.x - 4,
          top: pointer.y - 4,
          radius: 4,
          fill: '#06b6d4',
          stroke: '#fff',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          _isTemp: true,
        })
        fabricCanvas.add(startCircle)
        tempPoints.push(startCircle)
      } else {
        points.push({ x: pointer.x, y: pointer.y })

        const circle = new fabric.Circle({
          left: pointer.x - 4,
          top: pointer.y - 4,
          radius: 4,
          fill: '#06b6d4',
          stroke: '#fff',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          _isTemp: true,
        })
        fabricCanvas.add(circle)
        tempPoints.push(circle)

        if (points.length >= 2) {
          const prevPoint = points[points.length - 2]
          const line = new fabric.Line(
            [prevPoint.x, prevPoint.y, pointer.x, pointer.y],
            {
              stroke: '#06b6d4',
              strokeWidth: 2,
              selectable: false,
              evented: false,
              _isTemp: true,
            }
          )
          fabricCanvas.add(line)
          tempLines.push(line)
        }
      }

      fabricCanvas.renderAll()
    }

    mouseMoveHandler = (opt) => {
      if (activeTool.value !== 'polygon' || !isDrawing || points.length === 0) return
      const pointer = fabricCanvas.getPointer(opt.e)

      if (tempLines.length < points.length) {
        const lastPoint = points[points.length - 1]
        const previewLine = new fabric.Line(
          [lastPoint.x, lastPoint.y, pointer.x, pointer.y],
          {
            stroke: '#06b6d4',
            strokeWidth: 1,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
            _isTemp: true,
            _isPreview: true,
          }
        )
        fabricCanvas.add(previewLine)
        tempLines.push(previewLine)
      } else if (tempLines.length > 0 && tempLines[tempLines.length - 1]._isPreview) {
        const lastPoint = points[points.length - 1]
        tempLines[tempLines.length - 1].set({
          x2: pointer.x,
          y2: pointer.y,
        })
      }

      fabricCanvas.renderAll()
    }

    mouseDblClickHandler = () => {
      if (activeTool.value !== 'polygon' || !isDrawing) return

      if (points.length < 3) {
        clearTempObjects(fabricCanvas)
        isDrawing = false
        points = []
        return
      }

      clearTempObjects(fabricCanvas)

      const polygonPoints = points.map(p => ({ x: p.x, y: p.y }))
      const id = generateId()

      polygon = new fabric.Polygon(polygonPoints, {
        fill: 'rgba(6, 182, 212, 0.15)',
        stroke: '#06b6d4',
        strokeWidth: 2,
        strokeUniform: true,
        selectable: true,
        cornerColor: '#06b6d4',
        cornerStyle: 'circle',
        cornerSize: 8,
        transparentCorners: false,
        borderColor: '#06b6d4',
        padding: 2,
        perPixelTargetFind: true,
        targetFindTolerance: 10,
      })

      polygon._annotationId = id
      polygon._annotationType = 'polygon'

      fabricCanvas.add(polygon)
      polygon.setCoords()
      fabricCanvas.setActiveObject(polygon)
      fabricCanvas.renderAll()

      addAnnotation({
        id,
        type: 'polygon',
        label: '',
        color: '#06b6d4',
        coordinates: {
          points: polygonPoints,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      isDrawing = false
      points = []
      polygon = null
    }

    fabricCanvas.on('mouse:down', mouseDownHandler)
    fabricCanvas.on('mouse:move', mouseMoveHandler)
    fabricCanvas.on('mouse:dblclick', mouseDblClickHandler)
  }

  const clearTempObjects = (fabricCanvas) => {
    const objects = fabricCanvas.getObjects().slice()
    objects.forEach(obj => {
      if (obj._isTemp) {
        fabricCanvas.remove(obj)
      }
    })
    tempPoints = []
    tempLines = []
  }

  const destroyPolygon = () => {
    if (canvas.value) {
      canvas.value.off('mouse:down', mouseDownHandler)
      canvas.value.off('mouse:move', mouseMoveHandler)
      canvas.value.off('mouse:dblclick', mouseDblClickHandler)
    }
  }

  return { initPolygon, destroyPolygon }
}
