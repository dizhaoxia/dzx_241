import { useCanvasState } from './useCanvasState'

export function useCanvasZoom() {
  const { canvas, isPanning, setZoomLevel } = useCanvasState()

  let isSpacePressed = false
  let lastPosX = 0
  let lastPosY = 0
  let wheelHandler = null
  let keyDownHandler = null
  let keyUpHandler = null
  let mouseDownHandler = null
  let mouseMoveHandler = null
  let mouseUpHandler = null

  const initZoom = (fabricCanvas) => {
    wheelHandler = (opt) => {
      const delta = opt.e.deltaY
      let zoom = fabricCanvas.getZoom()
      zoom *= 0.999 ** delta
      if (zoom > 20) zoom = 20
      if (zoom < 0.1) zoom = 0.1

      fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom)
      setZoomLevel(zoom)
      opt.e.preventDefault()
      opt.e.stopPropagation()
    }

    keyDownHandler = (e) => {
      if (e.code === 'Space' && !isSpacePressed) {
        isSpacePressed = true
        isPanning.value = true
        fabricCanvas.selection = false
        e.preventDefault()
      }
    }

    keyUpHandler = (e) => {
      if (e.code === 'Space') {
        isSpacePressed = false
        isPanning.value = false
        fabricCanvas.selection = true
        fabricCanvas.defaultCursor = 'default'
        fabricCanvas.renderAll()
      }
    }

    mouseDownHandler = (opt) => {
      if (!isPanning.value) return
      fabricCanvas.defaultCursor = 'grab'
      fabricCanvas.setCursor('grab')
      lastPosX = opt.e.clientX
      lastPosY = opt.e.clientY
    }

    mouseMoveHandler = (opt) => {
      if (!isPanning.value || !opt.e.buttons) return
      fabricCanvas.setCursor('grabbing')
      const vpt = fabricCanvas.viewportTransform
      vpt[4] += opt.e.clientX - lastPosX
      vpt[5] += opt.e.clientY - lastPosY
      fabricCanvas.requestRenderAll()
      lastPosX = opt.e.clientX
      lastPosY = opt.e.clientY
    }

    mouseUpHandler = () => {
      if (isPanning.value) {
        fabricCanvas.setCursor('grab')
      }
    }

    fabricCanvas.on('mouse:wheel', wheelHandler)
    fabricCanvas.on('mouse:down', mouseDownHandler)
    fabricCanvas.on('mouse:move', mouseMoveHandler)
    fabricCanvas.on('mouse:up', mouseUpHandler)

    document.addEventListener('keydown', keyDownHandler)
    document.addEventListener('keyup', keyUpHandler)
  }

  const destroyZoom = () => {
    if (canvas.value) {
      canvas.value.off('mouse:wheel', wheelHandler)
      canvas.value.off('mouse:down', mouseDownHandler)
      canvas.value.off('mouse:move', mouseMoveHandler)
      canvas.value.off('mouse:up', mouseUpHandler)
    }
    document.removeEventListener('keydown', keyDownHandler)
    document.removeEventListener('keyup', keyUpHandler)
  }

  return { initZoom, destroyZoom }
}
