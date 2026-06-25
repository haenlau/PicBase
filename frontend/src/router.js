import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Upload',
    component: () => import('./views/Upload.vue'),
    meta: { requiresAuth: true }
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

// 路由守卫 - 检查登录状态
router.beforeEach(async (to, from, next) => {
  // 登录页面不需要认证
  if (to.path === '/login') {
    next()
    return
  }
  
  // 404页面不需要认证
  if (to.name === 'NotFound') {
    next()
    return
  }
  
  // 其他页面需要认证
  try {
    const res = await fetch('/api/auth/sessionCheck')
    const data = await res.json()
    
    if (data.valid) {
      next()
    } else {
      next('/login')
    }
  } catch {
    next('/login')
  }
})

export default router
