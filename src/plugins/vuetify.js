import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1f6fb2',
          secondary: '#0f172a',
          surface: '#ffffff',
          background: '#eef3f8',
          info: '#2563eb',
          success: '#15803d',
          warning: '#d97706',
          error: '#dc2626',
        },
      },
    },
  },
})
