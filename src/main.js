import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { bindAuthSessionHandlers } from './api/axios'
import { pinia } from './stores'
import { useAuthStore } from './stores/auth'
import './style.css'

const app = createApp(App)
const authStore = useAuthStore(pinia)

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
