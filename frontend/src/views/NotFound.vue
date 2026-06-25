<template>
  <div class="not-found-page">
    <div class="not-found-card glass-strong">
      <div class="not-found-code">404</div>
      <h1 class="not-found-title">页面未找到</h1>
      <p class="not-found-message">您访问的页面不存在或已被移除</p>
      <router-link to="/" class="btn btn-primary btn-lg">
        <span class="material-icons-outlined">home</span>
        返回首页
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
}

.not-found-card {
  text-align: center;
  padding: var(--space-2xl) var(--space-2xl);
  max-width: 400px;
  animation: scaleIn 0.3s ease;
}

.not-found-code {
  font-size: 96px;
  font-weight: 700;
  opacity: 0.3;
  line-height: 1;
  margin-bottom: var(--space-md);
}

.not-found-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: var(--space-sm);
}

.not-found-message {
  color: var(--text-secondary);
  margin-bottom: var(--space-xl);
}
</style>
