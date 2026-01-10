/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: nativewind targets files differently
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                // Navy Palette
                navy: {
                    950: "#020617",
                    900: "#0f172a",
                    800: "#1e293b",
                    700: "#334155",
                    600: "#475569",
                    500: "#64748b",
                },
                // Brand Colors
                primary: {
                    DEFAULT: "#0f172a",
                    dark: "#020617",
                    light: "#1e293b",
                },
                gold: {
                    DEFAULT: "#fbbf24",
                    light: "#fcd34d",
                    dark: "#f59e0b",
                },
                accent: "#f59e0b",
            },
            fontFamily: {
                // React Native handles fonts differently (usually by loading custom fonts with useFonts)
                // We'll map 'sans' to system for now, and 'serif' to system serif
                sans: ["System"],
                serif: ["System"],
            },
        },
    },
    plugins: [],
}
