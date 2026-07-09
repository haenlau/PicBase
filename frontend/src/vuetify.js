import 'vuetify/styles'
import './styles/mdi-subset.css'
import { createVuetify } from 'vuetify'

const lightTheme = {
  dark: false,
  colors: {
    primary: '#0F7CFF',
    'primary-darken-1': '#075DCC',
    secondary: '#00A6FF',
    'secondary-darken-1': '#0077B8',
    tertiary: '#F38020',
    error: '#B3261E',
    'error-darken-1': '#601410',
    surface: '#FFFFFF',
    'surface-variant': '#EAF4FF',
    'on-surface': '#18181B',
    'on-surface-variant': '#52525B',
    background: '#FAFAFA',
    'on-background': '#18181B'
  }
}

const darkTheme = {
  dark: true,
  colors: {
    primary: '#5AA9FF',
    'primary-darken-1': '#0D3D66',
    secondary: '#37D4FF',
    'secondary-darken-1': '#0E5266',
    tertiary: '#FF9B45',
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
