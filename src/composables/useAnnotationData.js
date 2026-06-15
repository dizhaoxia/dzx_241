import { fabric } from 'fabric'
import { useCanvasState } from './useCanvasState'
import { saveToLocal, loadFromLocal, clearLocal } from '@/utils/storage'
import { exportJSON, importJSON } from '@/utils/export'
import { ElMessage } from 'element-plus'

export function useAnnotationData() {
  const { canvas, annotations, setAnnotations, clearAnnotations, setActiveTool } = useCanvasState()

  const buildExportData = () => {
    const fabricCanvas = canvas.value
    if (!fabricCanvas) return null

    const annotationObjects = fabricCanvas.getObjects().filter(obj => obj._isAnnotation || obj._annotationId)

    const data = {
      version: '1.0',
      canvasWidth: fabricCanvas.getWidth(),
      canvasHeight: fabricCanvas.getHeight(),
      annotations: annotationObjects.map(obj => {
        const base = {
          id: obj._annotationId,
          type: obj._annotationType,
          label: '',
          color: obj.stroke || '#06b6d4',
        }

        if (obj._annotationType === 'rect') {
          base.coordinates = {
            x: obj.left,
            y: obj.top,
            width: obj.width * obj.scaleX,
            height: obj.height * obj.scaleY,
          }
        } else if (obj._annotationType === 'polygon') {
          let polygonPoints = []
          if (obj._polygonPoints && Array.isArray(obj._polygonPoints)) {
            polygonPoints = obj._polygonPoints
          } else if (obj.points) {
            polygonPoints = obj.points.map(p => ({ x: p.x, y: p.y }))
          }
          base.coordinates = { points: polygonPoints }
        } else if (obj._annotationType === 'text' || obj._annotationType === 'label') {
          base.coordinates = { x: obj.left, y: obj.top }
          base.label = obj.text || ''
        }

        return base
      }),
      createdAt: new Date().toISOString(),
    }

    return data
  }

  const handleExport = () => {
    const data = buildExportData()
    if (!data || data.annotations.length === 0) {
      ElMessage.warning('没有可导出的标注数据')
      return
    }
    exportJSON(data)
    saveToLocal(data)
    ElMessage.success('标注数据已导出')
  }

  const handleImport = async (file) => {
    try {
      const data = await importJSON(file.raw || file)
      if (!data.annotations || !Array.isArray(data.annotations)) {
        ElMessage.error('无效的标注数据文件')
        return
      }
      restoreAnnotations(data)
      ElMessage.success('标注数据已导入')
    } catch (e) {
      ElMessage.error(e.message || '导入失败')
    }
    return false
  }

  const restoreAnnotations = (data) => {
    const fabricCanvas = canvas.value
    if (!fabricCanvas) return

    const objects = fabricCanvas.getObjects().slice()
    objects.forEach(obj => {
      if (obj._isAnnotation || obj._annotationId) {
        fabricCanvas.remove(obj)
      }
    })

    data.annotations.forEach(ann => {
      let fabricObj = null

      if (ann.type === 'rect') {
        fabricObj = new fabric.Rect({
          left: ann.coordinates.x,
          top: ann.coordinates.y,
          width: ann.coordinates.width,
          height: ann.coordinates.height,
          fill: 'rgba(6, 182, 212, 0.15)',
          stroke: ann.color || '#06b6d4',
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
        })
      } else if (ann.type === 'polygon') {
        fabricObj = new fabric.Polygon(ann.coordinates.points, {
          fill: 'rgba(6, 182, 212, 0.25)',
          stroke: ann.color || '#06b6d4',
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
          originX: 'left',
          originY: 'top',
        })
        fabricObj.set('_polygonPoints', ann.coordinates.points)
      } else if (ann.type === 'text' || ann.type === 'label') {
        fabricObj = new fabric.Textbox(ann.label || '文本', {
          left: ann.coordinates.x,
          top: ann.coordinates.y,
          fontSize: ann.type === 'label' ? 12 : 16,
          fontFamily: 'Noto Sans SC, sans-serif',
          fill: ann.type === 'label' ? '#06b6d4' : '#1e293b',
          backgroundColor: 'rgba(6, 182, 212, 0.08)',
          padding: ann.type === 'label' ? 4 : 6,
          editable: true,
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          cornerColor: '#06b6d4',
          cornerStyle: 'circle',
          cornerSize: 8,
          transparentCorners: false,
          borderColor: '#06b6d4',
        })
      }

      if (fabricObj) {
        fabricObj.set('_annotationId', ann.id)
        fabricObj.set('_annotationType', ann.type)
        fabricObj.set('_isAnnotation', true)
        fabricCanvas.add(fabricObj)
        fabricObj.setCoords()
      }
    })

    fabricCanvas.discardActiveObject()
    fabricCanvas.renderAll()
    setAnnotations(data.annotations)
  }

  const handleClearAll = () => {
    const fabricCanvas = canvas.value
    if (!fabricCanvas) return

    const allObjects = fabricCanvas.getObjects()
    const toRemove = []
    for (let i = allObjects.length - 1; i >= 0; i--) {
      const obj = allObjects[i]
      if (obj._isAnnotation || obj._annotationId) {
        toRemove.push(obj)
      }
    }
    toRemove.forEach(obj => {
      fabricCanvas.remove(obj)
    })

    fabricCanvas.discardActiveObject()
    fabricCanvas.renderAll()
    clearAnnotations()
    clearLocal()
    setActiveTool('select')
    ElMessage.success('已清空所有标注')
  }

  return {
    handleExport,
    handleImport,
    handleClearAll,
  }
}
