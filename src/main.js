import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { bindAuthSessionHandlers } from './api/axios'
import faviconLogo from './assets/images/logo/logo-favicon.png'
import { pinia } from './stores'
import { useAuthStore } from './stores/auth'
import './style.css'

const app = createApp(App)
const authStore = useAuthStore(pinia)
const faviconElement = document.querySelector('link[rel="icon"]')

if (faviconElement) {
  faviconElement.setAttribute('href', faviconLogo)
  faviconElement.setAttribute('type', 'image/png')
}

bindAuthSessionHandlers({
  getAccessToken: () => authStore.accessToken,
  applyAccessToken: (token) => authStore.setAccessToken(token),
  handleAuthFailure: async () => {
    authStore.clearAuth()

    if (router.currentRoute.value.path !== '/login') {
      await router.push('/login')
    }
  },
})

await authStore.restoreSession()

app.use(pinia)
app.use(router)
app.use(vuetify)

app.mount('#app')
