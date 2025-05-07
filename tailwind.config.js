// tailwind.config.js
module.exports = {
    theme: {
      extend: {
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          slideUp: {
            '0%': { opacity: '0', transform: 'translateY(20px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
        },
        animation: {
          fadeIn: 'fadeIn 0.3s ease-out',
          slideUp: 'slideUp 0.3s ease-out',
        },
      },
    },
    plugins: [],
  }
  