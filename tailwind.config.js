module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      neutral: {
        500: "#F8FAFC",
      },
      primary: {
        200: "#C6E4D9",
        500: "#78FFD6",
        700: "#6ee7b7",
      },
      blue: {
        300: "#173f4f",
        500: "#80fefd",
      },
      warning: {
        500: "#F7F8D4",
      },
      success: {
        500: "#78FFD6",
      },
      error: {
        500: "#D9503D",
      },
      secondary: {
        300: "#9CA3AF",
        500: "#181F24",
        600: "#1E282F",
        700: "#262D3A",
      },
      dark: {
        50: "#5F626B",
        100: "#555962",
        200: "#4C4F59",
        300: "#424651",
        400: "#393D48",
        500: "#393D48",
        600: "#2F343F",
        700: "#262A36",
        800: "#1C212E",
        900: "#131825",
      },
      white: "#FFFFFF",
      black: "#000000",
      background: "#141A1E",
      opensea:  "#3491e9",

    },
    extend: {
      fontFamily: {
        Ubuntu: ['Ubuntu'],
      },
      boxShadow: {
        glow: "0px 0px 30px rgba(120, 255, 214, 0.25)",
      },
    },
  },
  plugins: [],
}
