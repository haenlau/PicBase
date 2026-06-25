import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Upload',
    component: () => import('./views/Upload.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('./views/Login.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('./views/Admin.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('./views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      const res = await fetch('/api/auth/sessionCheck')
      const data = await res.json()
      if (data.valid && data.authType === 'admin') {
        next()
      } else {
        next('/login')
      }
    } catch {
      next('/login')
    }
  } else {
    next()
  }
})

export default router
