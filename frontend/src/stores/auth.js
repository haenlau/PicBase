import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/axios'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAdmin = ref(false)
  const isAuthenticated = ref(false)
  const initialized = ref(false)
  const loading = ref(false)

  const checkSession = async () => {
    try {
      const response = await api.get('/api/auth/sessionCheck')
      if (response.data.authenticated) {
        isAuthenticated.value = true
        isAdmin.value = response.data.isAdmin || false
        user.value = response.data.user || {}
      } else {
        isAuthenticated.value = false
        isAdmin.value = false
        user.value = null
      }
    } catch (error) {
      isAuthenticated.value = false
      isAdmin.value = false
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  const login = async (authCode) => {
    loading.value = true
    try {
      const response = await api.post('/api/auth/login', { authCode })
      if (response.status === 200) {
        isAuthenticated.value = true
        await checkSession()
        return { success: true }
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data || 'Login failed' 
      }
    } finally {
      loading.value = false
    }
  }

  const adminLogin = async (username, password) => {
    loading.value = true
    try {
      const response = await api.post('/api/auth/adminLogin', { username, password })
      if (response.status === 200) {
        isAuthenticated.value = true
        isAdmin.value = true
        await checkSession()
        return { success: true }
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data || 'Login failed' 
      }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      isAuthenticated.value = false
      isAdmin.value = false
      user.value = null
    }
  }

  return {
    user,
    isAdmin,
    isAuthenticated,
    initialized,
    loading,
    checkSession,
    login,
    adminLogin,
    logout
  }
})
