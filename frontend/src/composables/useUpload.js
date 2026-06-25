import { ref, computed } from 'vue'
import { useUploadStore } from '@/stores/upload'
import { formatFileSize } from '@/utils/helpers'
import { MAX_FILE_SIZE } from '@/utils/constants'

export function useUpload() {
  const uploadStore = useUploadStore()
  const dragover = ref(false)

  const files = computed(() => uploadStore.files)
  const uploading = computed(() => uploadStore.uploading)
  const totalFiles = computed(() => uploadStore.totalFiles)
  const completedFiles = computed(() => uploadStore.completedFiles)
  const failedFiles = computed(() => uploadStore.failedFiles)

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large: ${formatFileSize(file.size)} (max: ${formatFileSize(MAX_FILE_SIZE)})`
      }
    }
    return { valid: true }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    dragover.value = false

    const droppedFiles = event.dataTransfer.files
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles)
    }
  }

  const handleDragover = (event) => {
    event.preventDefault()
    dragover.value = true
  }

  const handleDragleave = () => {
    dragover.value = false
  }

  const handleFileSelect = (event) => {
    const selectedFiles = event.target.files
    if (selectedFiles.length > 0) {
      addFiles(selectedFiles)
    }
    // Reset input
    event.target.value = ''
  }

  const addFiles = (newFiles) => {
    const validFiles = []
    for (const file of newFiles) {
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      }
    }
    if (validFiles.length > 0) {
      uploadStore.addFiles(validFiles)
    }
  }

  const removeFile = (fileId) => {
    uploadStore.removeFile(fileId)
  }

  const clearFiles = () => {
    uploadStore.clearFiles()
  }

  const uploadAll = async () => {
    await uploadStore.uploadAll()
  }

  const uploadFile = async (fileObj) => {
    return await uploadStore.uploadFile(fileObj)
  }

  return {
    files,
    uploading,
    totalFiles,
    completedFiles,
    failedFiles,
    dragover,
    handleDrop,
    handleDragover,
    handleDragleave,
    handleFileSelect,
    addFiles,
    removeFile,
    clearFiles,
    uploadAll,
    uploadFile
  }
}
