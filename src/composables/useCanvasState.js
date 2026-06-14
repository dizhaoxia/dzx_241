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
  }
}
