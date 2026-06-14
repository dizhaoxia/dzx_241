const STORAGE_KEY = 'image_annotation_data'

export function saveToLocal(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (e) {
    console.error('保存到localStorage失败:', e)
    return false
  }
}

export function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.error('从localStorage读取失败:', e)
    return null
  }
}

export function clearLocal() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (e) {
    console.error('清除localStorage失败:', e)
    return false
  }
}
