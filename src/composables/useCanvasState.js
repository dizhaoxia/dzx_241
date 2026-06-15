import { reactive, toRefs } from 'vue'

const state = reactive({
  canvas: null,
  activeTool: 'select',
  zoomLevel: 1,
  isPanning: false,
  selectedObject: null,
  imageLoaded: false,
  annotations: [],
  loadImageFn: null,
  distributeHorizontalFn: null,
  distributeVerticalFn: null,
  annotationsVisible: true,
  fillOpacity: 0.25,
})

export function useCanvasState() {
  const setActiveTool = (tool) => {
    state.activeTool = tool
  }

  const setCanvas = (canvas) => {
    state.canvas = canvas
  }

  const setSelectedObject = (obj) => {
    state.selectedObject = obj
  }

  const setImageLoaded = (loaded) => {
    state.imageLoaded = loaded
  }

  const addAnnotation = (annotation) => {
    state.annotations.push(annotation)
  }

  const removeAnnotation = (id) => {
    state.annotations = state.annotations.filter(a => a.id !== id)
  }

  const clearAnnotations = () => {
    state.annotations = []
  }

  const setAnnotations = (annotations) => {
    state.annotations = annotations
  }

  const setZoomLevel = (level) => {
    state.zoomLevel = level
  }

  const setLoadImageFn = (fn) => {
    state.loadImageFn = fn
  }

  const loadImage = (file) => {
    if (state.loadImageFn) {
      state.loadImageFn(file)
    }
  }

  const setDistributeHorizontalFn = (fn) => {
    state.distributeHorizontalFn = fn
  }

  const setDistributeVerticalFn = (fn) => {
    state.distributeVerticalFn = fn
  }

  const distributeHorizontal = () => {
    if (state.distributeHorizontalFn) {
      return state.distributeHorizontalFn()
    }
    return false
  }

  const distributeVertical = () => {
    if (state.distributeVerticalFn) {
      return state.distributeVerticalFn()
    }
    return false
  }

  const toggleAnnotationsVisible = () => {
    state.annotationsVisible = !state.annotationsVisible
  }

  const setAnnotationsVisible = (visible) => {
    state.annotationsVisible = visible
  }

  const setFillOpacity = (opacity) => {
    state.fillOpacity = Math.max(0, Math.min(1, opacity))
  }

  return {
    ...toRefs(state),
    setActiveTool,
    setCanvas,
    setSelectedObject,
    setImageLoaded,
    addAnnotation,
    removeAnnotation,
    clearAnnotations,
    setAnnotations,
    setZoomLevel,
    setLoadImageFn,
    loadImage,
    setDistributeHorizontalFn,
    setDistributeVerticalFn,
    distributeHorizontal,
    distributeVertical,
    toggleAnnotationsVisible,
    setAnnotationsVisible,
    setFillOpacity,
  }
}
