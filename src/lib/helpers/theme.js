import ENVS from "./envs";

let THEME_CONFIG

const THEME = {
    colors: () => {
        return THEME.lightColors().concat(THEME.darkColors())
    },
    lightColors: () => {
        return [
            '#68bdf6', // light blue
            '#6dce9e', // green #1
            '#faafc2', // light pink
            '#f2baf6', // purple
            '#ff928c', // light red
            '#fcea7e', // light yellow
            '#ffc766', // light orange
            '#78cecb', // green #2,
            '#b88cbb', // dark purple
        ];
    },
    darkColors: () => {
        return [
            // DARK COLORS
            '#405f9e', // navy blue
            '#e84646', // dark red
            '#fa5f86', // dark pink
            '#ffab1a', // dark orange
            '#fcda19', // dark yellow
            '#c9d96f', // pistacchio
            '#47991f', // green #3
            '#ff75ea'  // pink
        ];
    },
    isLightColor: (color) => {
        color = +("0x" + color.slice(1).replace(
            color.length < 5 && /./g, '$&$&'));

        let r = color >> 16;
        let g = color >> 8 & 255;
        let b = color & 255;

        let hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b))
        return hsp > 127.5
    },
    randomColor: () => {
        let hexTab = "5555556789ABCDEF";
        let r = hexTab[ Math.floor( Math.random() * 16) ];
        let g = hexTab[ Math.floor( Math.random() * 16) ];
        let b = hexTab[ Math.floor( Math.random() * 16) ];
        let color = "#" + r + g + b
        return {color, light: THEME.isLightColor(color)};
    },
    cssProps: () => {
        const themeConfig = ENVS.theme()
        for (let t in themeConfig.cssProps) {
            document.body.style.setProperty(
                `--${t}`,
                `${themeConfig.cssProps[t]}`
            );
        }
        document.documentElement.classList.add(`theme--${themeConfig.theme || 'dark'}`)
    },
    getStatusColor: (status) => {
        status = status.toLowerCase()
        if (!THEME_CONFIG) {
            // Store this to avoid constantly parsing during table build
            THEME_CONFIG = ENVS.theme()
        }
        const statusColors = THEME_CONFIG.statusColors || {}
        const colors =  statusColors[status]?.split(':')
        const bg = colors ? colors[0] : (statusColors.default || 'darkgrey')
        const text = colors && colors.length > 1 ? colors[1] : 'white'
        return {bg, text}
    }
}

export default THEME