import api from '@/utils/axios'

export const authApi = {
  login: (authCode) => api.post('/api/auth/login', { authCode }),
  adminLogin: (username, password) => api.post('/api/auth/adminLogin', { username, password }),
  logout: () => api.post('/api/auth/logout'),
  checkSession: () => api.get('/api/auth/sessionCheck')
}

export const uploadApi = {
  upload: (formData, params, onProgress) => {
    const queryString = new URLSearchParams(params).toString()
    return api.post(`/upload?${queryString}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
      timeout: 0 // No timeout for uploads
    })
  },
  getChannels: () => api.get('/api/channels')
}

export const manageApi = {
  getFiles: (params) => api.get('/api/manage/list', { params }),
  deleteFile: (path) => api.delete(`/api/manage/delete/${path}`),
  renameFile: (path, data) => api.put(`/api/manage/rename/${path}`, data),
  moveFile: (path, data) => api.put(`/api/manage/move/${path}`, data),
  getFileMetadata: (path) => api.get(`/api/manage/metadata/${path}`),
  updateFileMetadata: (path, data) => api.put(`/api/manage/metadata/${path}`, data),
  getQuota: () => api.get('/api/manage/quota'),
  getDirectoryTree: () => api.get('/api/directoryTree')
}

export const tagApi = {
  getTags: (params) => api.get('/api/manage/tags/autocomplete', { params }),
  addTag: (path, tag) => api.post(`/api/manage/tags/${path}`, { tag }),
  removeTag: (path, tag) => api.delete(`/api/manage/tags/${path}`, { data: { tag } }),
  batchAddTags: (paths, tags) => api.post('/api/manage/tags/batch', { paths, tags, action: 'add' }),
  batchRemoveTags: (paths, tags) => api.post('/api/manage/tags/batch', { paths, tags, action: 'remove' })
}

export const configApi = {
  getUploadConfig: () => api.get('/api/manage/sysConfig/upload'),
  updateUploadConfig: (data) => api.put('/api/manage/sysConfig/upload', data),
  getSecurityConfig: () => api.get('/api/manage/sysConfig/security'),
  updateSecurityConfig: (data) => api.put('/api/manage/sysConfig/security', data),
  getPageConfig: () => api.get('/api/manage/sysConfig/page'),
  updatePageConfig: (data) => api.put('/api/manage/sysConfig/page', data),
  getOthersConfig: () => api.get('/api/manage/sysConfig/others'),
  updateOthersConfig: (data) => api.put('/api/manage/sysConfig/others', data),
  getUserConfig: () => api.get('/api/userConfig')
}

export const publicApi = {
  getPublicList: (params) => api.get('/api/public/list', { params }),
  getRandomImage: () => api.get('/random')
}
