import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/axios'

export const useUploadStore = defineStore('upload', () => {
  const files = ref([])
  const uploading = ref(false)
  const channels = ref({})
  const selectedChannel = ref('')
  const selectedChannelName = ref('')
  const uploadFolder = ref('')
  const uploadHistory = ref(JSON.parse(localStorage.getItem('uploadHistory') || '[]'))

  const totalFiles = computed(() => files.value.length)
  const completedFiles = computed(() => files.value.filter(f => f.status === 'completed').length)
  const failedFiles = computed(() => files.value.filter(f => f.status === 'error').length)
  const isUploading = computed(() => files.value.some(f => f.status === 'uploading'))

  const fetchChannels = async () => {
    try {
      const response = await api.get('/api/channels')
      channels.value = response.data
    } catch (error) {
      console.error('Failed to fetch channels:', error)
    }
  }

  const addFiles = (newFiles) => {
    const fileObjects = Array.from(newFiles).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
      url: null,
      error: null
    }))
    files.value.push(...fileObjects)
  }

  const removeFile = (fileId) => {
    files.value = files.value.filter(f => f.id !== fileId)
  }

  const clearFiles = () => {
    files.value = []
  }

  const uploadFile = async (fileObj) => {
    const formData = new FormData()
    formData.append('file', fileObj.file)

    const params = new URLSearchParams()
    params.append('uploadChannel', selectedChannel.value)
    if (selectedChannelName.value) {
      params.append('channelName', selectedChannelName.value)
    }
    if (uploadFolder.value) {
      params.append('uploadFolder', uploadFolder.value)
    }

    try {
      fileObj.status = 'uploading'
      fileObj.progress = 0

      const response = await api.post(`/upload?${params.toString()}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 0,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            fileObj.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          }
        }
      })

      if (response.status === 200) {
        fileObj.status = 'completed'
        fileObj.url = response.data[0]?.src || null
        fileObj.progress = 100
        
        // Add to history
        addToHistory({
          name: fileObj.name,
          size: fileObj.size,
          url: fileObj.url,
          time: Date.now()
        })
        
        return { success: true }
      }
    } catch (error) {
      fileObj.status = 'error'
      fileObj.error = error.response?.data || 'Upload failed'
      return { success: false, error: fileObj.error }
    }
  }

  const uploadAll = async () => {
    uploading.value = true
    const pendingFiles = files.value.filter(f => f.status === 'pending')
    
    for (const file of pendingFiles) {
      await uploadFile(file)
    }
    
    uploading.value = false
  }

  const addToHistory = (item) => {
    uploadHistory.value.unshift(item)
    if (uploadHistory.value.length > 100) {
      uploadHistory.value = uploadHistory.value.slice(0, 100)
    }
    localStorage.setItem('uploadHistory', JSON.stringify(uploadHistory.value))
  }

  const clearHistory = () => {
    uploadHistory.value = []
    localStorage.removeItem('uploadHistory')
  }

  return {
    files,
    uploading,
    channels,
    selectedChannel,
    selectedChannelName,
    uploadFolder,
    uploadHistory,
    totalFiles,
    completedFiles,
    failedFiles,
    isUploading,
    fetchChannels,
    addFiles,
    removeFile,
    clearFiles,
    uploadFile,
    uploadAll,
    clearHistory
  }
})
