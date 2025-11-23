/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			'brand-yellow': '#F0E491',
  			'brand-lime': '#BBC863',
  			'brand-green': '#658C58',
  			'brand-dark-green': '#31694E',
  			terminal: {
  				black: '#050505',
  				phosphor: '#00ff41',
  				'phosphor-dim': '#00cc33',
  				amber: '#ffb000',
  				'amber-dim': '#cc8800',
  				muted: '#333333',
  				'muted-dim': '#1a1a1a'
  			},
  			border: 'hsl(var(--border))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			mono: [
  				'Fira Code',
  				'VT323',
  				'Courier New',
  				'monospace'
  			],
  			terminal: [
  				'VT323',
  				'Fira Code',
  				'Courier New',
  				'monospace'
  			]
  		},
  		maxWidth: {
  			container: '1280px'
  		},
  		textShadow: {
  			glow: '0 0 5px currentColor',
  			'glow-sm': '0 0 3px currentColor',
  			'glow-md': '0 0 8px currentColor',
  			'glow-lg': '0 0 12px currentColor',
  			phosphor: '0 0 5px #00ff41, 0 0 10px #00ff41, 0 0 15px #00ff41',
  			amber: '0 0 5px #ffb000, 0 0 10px #ffb000, 0 0 15px #ffb000'
  		},
  		boxShadow: {
  			terminal: 'inset 0 0 100px rgba(0, 255, 65, 0.1)',
  			scanline: 'inset 0 0 0 1px rgba(0, 255, 65, 0.1)'
  		},
  		animation: {
  			marquee: 'marquee var(--duration) linear infinite'
  		},
  		keyframes: {
  			marquee: {
  				from: {
  					transform: 'translateX(0)'
  				},
  				to: {
  					transform: 'translateX(calc(-100% - var(--gap)))'
  				}
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.text-shadow-glow': {
          textShadow: '0 0 5px currentColor',
        },
        '.text-shadow-glow-sm': {
          textShadow: '0 0 3px currentColor',
        },
        '.text-shadow-glow-md': {
          textShadow: '0 0 8px currentColor',
        },
        '.text-shadow-glow-lg': {
          textShadow: '0 0 12px currentColor',
        },
        '.text-shadow-phosphor': {
          textShadow: '0 0 5px #00ff41, 0 0 10px #00ff41, 0 0 15px #00ff41',
        },
        '.text-shadow-amber': {
          textShadow: '0 0 5px #ffb000, 0 0 10px #ffb000, 0 0 15px #ffb000',
        },
      }
      addUtilities(newUtilities)
    },
      require("tailwindcss-animate")
],
}
