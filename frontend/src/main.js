import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import App from './App.vue'
import router from './router'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'
import './styles/global.css'
import { themes } from './styles/vuetify-theme'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || navigator.language || 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-CN': zhCN
  }
})

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: localStorage.getItem('darkMode') === 'true' ? 'dark' : 'light',
    themes
  },
  defaults: {
    VBtn: {
      rounded: 'lg',
      variant: 'flat'
    },
    VCard: {
      rounded: 'xl',
      elevation: 0
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable'
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable'
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable'
    },
    VChip: {
      rounded: 'lg'
    },
    VDialog: {
      maxWidth: 600
    },
    VAppBar: {
      flat: true
    }
  }
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(vuetify)

app.mount('#app')
