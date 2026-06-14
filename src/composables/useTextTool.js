import { fabric } from 'fabric'
import { useCanvasState } from './useCanvasState'
import { generateId } from '@/utils/export'

export function useTextTool() {
  const { canvas, activeTool, addAnnotation } = useCanvasState()

  let mouseDownHandler = null

  const initTextTool = (fabricCanvas) => {
    mouseDownHandler = (opt) => {
      if (activeTool.value !== 'text') return

      const pointer = fabricCanvas.getPointer(opt.e)
      const active = fabricCanvas.getActiveObject()
      if (active && active._annotationId) {
        addTextToAnnotation(fabricCanvas, active, pointer)
        return
      }

      const id = generateId()
      const textbox = new fabric.Textbox('文本标注', {
        left: pointer.x,
        top: pointer.y,
        fontSize: 16,
        fontFamily: 'Noto Sans SC, sans-serif',
        fill: '#1e293b',
        stroke: '#06b6d4',
        strokeWidth: 0,
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        padding: 6,
        editable: true,
        selectable: true,
        cornerColor: '#06b6d4',
        cornerStyle: 'circle',
        cornerSize: 8,
        transparentCorners: false,
        borderColor: '#06b6d4',
      })

      textbox._annotationId = id
      textbox._annotationType = 'text'

      fabricCanvas.add(textbox)
      fabricCanvas.setActiveObject(textbox)
      textbox.enterEditing()
      textbox.selectAll()
      fabricCanvas.renderAll()

      addAnnotation({
        id,
        type: 'text',
        label: '文本标注',
        color: '#06b6d4',
        coordinates: {
          x: pointer.x,
          y: pointer.y,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    fabricCanvas.on('mouse:down', mouseDownHandler)
  }

  const addTextToAnnotation = (fabricCanvas, annotationObj, pointer) => {
    if (annotationObj._labelAdded) return
    annotationObj._labelAdded = true

    const label = new fabric.Textbox('标签', {
      left: annotationObj.left,
      top: annotationObj.top - 24,
      fontSize: 12,
      fontFamily: 'Noto Sans SC, sans-serif',
      fill: '#06b6d4',
      backgroundColor: 'rgba(6, 182, 212, 0.12)',
      padding: 4,
      editable: true,
      selectable: true,
      cornerColor: '#06b6d4',
      cornerStyle: 'circle',
      cornerSize: 6,
      transparentCorners: false,
      borderColor: '#06b6d4',
    })

    label._annotationId = annotationObj._annotationId
    label._annotationType = 'label'

    fabricCanvas.add(label)
    fabricCanvas.setActiveObject(label)
    label.enterEditing()
    label.selectAll()
    fabricCanvas.renderAll()
  }

  const destroyTextTool = () => {
    if (canvas.value) {
      canvas.value.off('mouse:down', mouseDownHandler)
    }
  }

  return { initTextTool, destroyTextTool }
}
