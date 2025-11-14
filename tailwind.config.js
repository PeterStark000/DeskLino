/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.html",
    "./src/scripts/**/*.js",
    "./node_modules/flowbite/**/*.js"
  ],
  safelist: [
    // Garantir utilitários de espaçamento usados dinamicamente
    'gap-0','gap-1','gap-2','gap-3','gap-4','gap-5','gap-6','gap-8','gap-10','gap-12'
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
};
