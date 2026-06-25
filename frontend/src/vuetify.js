import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const lightTheme = {
  dark: false,
  colors: {
    primary: '#6750A4',
    'primary-darken-1': '#21005D',
    secondary: '#625B71',
    'secondary-darken-1': '#1D192B',
    tertiary: '#7D5260',
    error: '#B3261E',
    'error-darken-1': '#601410',
    surface: '#FFFBFE',
    'surface-variant': '#E7E0EC',
    'on-surface': '#1C1B1F',
    'on-surface-variant': '#49454F',
    background: '#FEF7FF',
    'on-background': '#1C1B1F'
  }
}

const darkTheme = {
  dark: true,
  colors: {
    primary: '#D0BCFF',
    'primary-darken-1': '#381E72',
    secondary: '#CCC2DC',
    'secondary-darken-1': '#332D41',
    tertiary: '#EFB8C8',
    error: '#F2B8B5',
    'error-darken-1': '#8C1D18',
    surface: '#1C1B1F',
    'surface-variant': '#49454F',
    'on-surface': '#E6E1E5',
    'on-surface-variant': '#CAC4D0',
    background: '#1C1B1F',
    'on-background': '#E6E1E5'
  }
}

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'lightTheme',
    themes: {
      lightTheme,
      darkTheme
    }
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
      density: 'comfortable',
      color: 'primary'
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary'
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

export default vuetify
