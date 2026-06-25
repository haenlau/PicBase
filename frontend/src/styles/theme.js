import { createTheme } from '@mui/material/styles'

export const createAppTheme = (darkMode = false) => {
  const mode = darkMode ? 'dark' : 'light'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#6750A4',
        light: '#E8DEF8',
        dark: '#21005D',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#625B71',
        light: '#E8DEF8',
        dark: '#1D192B'
      },
      tertiary: {
        main: '#7D5260',
        light: '#FFD8E4',
        dark: '#31111D'
      },
      background: {
        default: mode === 'light' ? '#FEF7FF' : '#1C1B1F',
        paper: mode === 'light' ? '#FFFBFE' : '#2B2930'
      },
      surface: {
        main: mode === 'light' ? '#FFFBFE' : '#2B2930',
        variant: mode === 'light' ? '#E7E0EC' : '#49454F'
      },
      error: {
        main: '#B3261E',
        light: '#F9DEDC',
        dark: '#601410'
      },
      success: {
        main: '#386A20',
        light: '#C4EED0',
        dark: '#1F3712'
      },
      warning: {
        main: '#7D5700',
        light: '#FFDDB3',
        dark: '#2A1800'
      },
      info: {
        main: '#00639B',
        light: '#CEE5FF',
        dark: '#001D31'
      },
      text: {
        primary: mode === 'light' ? '#1C1B1F' : '#E6E1E5',
        secondary: mode === 'light' ? '#49454F' : '#CAC4D0',
        disabled: mode === 'light' ? '#79747E' : '#938F99'
      },
      divider: mode === 'light' ? '#CAC4D0' : '#49454F'
    },
    shape: {
      borderRadius: 16
    },
    typography: {
      fontFamily: '"Roboto", "Noto Sans SC", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 400,
        lineHeight: 1.2
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 400,
        lineHeight: 1.3
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 400,
        lineHeight: 1.3
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 400,
        lineHeight: 1.4
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 400,
        lineHeight: 1.5
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.5
      },
      body1: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.5
      },
      body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.43
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 500,
        lineHeight: 1.75,
        textTransform: 'none'
      }
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            padding: '10px 24px',
            textTransform: 'none',
            fontWeight: 500
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === 'light' 
              ? '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)'
              : '0 1px 3px 1px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.3)'
          }
        }
      },
      MuiFab: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 1px 3px 1px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.3)'
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 28
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12
            }
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: `1px solid ${mode === 'light' ? '#CAC4D0' : '#49454F'}`
          }
        }
      }
    }
  })
}
