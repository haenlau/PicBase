import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/upload'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { layout: 'auth', requiresAuth: false }
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/AdminLogin.vue'),
    meta: { layout: 'auth', requiresAuth: false }
  },
  {
    path: '/upload',
    name: 'Upload',
    component: () => import('@/views/Upload.vue'),
    meta: { layout: 'user', requiresAuth: true }
  },
  {
    path: '/browse',
    name: 'Browse',
    component: () => import('@/views/Browse.vue'),
    meta: { layout: 'user', requiresAuth: false }
  },
  {
    path: '/file/:path(.*)',
    name: 'FileView',
    component: () => import('@/views/Browse.vue'),
    meta: { layout: 'user', requiresAuth: false }
  },
  {
    path: '/admin',
    name: 'Admin',
    redirect: '/admin/dashboard'
  },
  {
    path: '/admin/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { layout: 'admin', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/channels',
    name: 'Channels',
    component: () => import('@/views/ChannelConfig.vue'),
    meta: { layout: 'admin', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: { layout: 'admin', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/settings/:tab',
    name: 'SettingsTab',
    component: () => import('@/views/Settings.vue'),
    meta: { layout: 'admin', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { layout: 'auth' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Check session on first load
  if (!authStore.initialized) {
    await authStore.checkSession()
  }

  const requiresAuth = to.meta.requiresAuth === true
  const requiresAdmin = to.meta.requiresAdmin === true

  // If route requires auth and user is not authenticated
  if (requiresAuth && !authStore.isAuthenticated) {
    if (requiresAdmin) {
      next({ name: 'AdminLogin', query: { redirect: to.fullPath } })
    } else {
      next({ name: 'Login', query: { redirect: to.fullPath } })
    }
    return
  }

  // If route requires admin and user is not admin
  if (requiresAdmin && !authStore.isAdmin) {
    next({ name: 'AdminLogin', query: { redirect: to.fullPath } })
    return
  }

  next()
})

export default router
