
const isDebugMode = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
        const urlParams = new URLSearchParams(window.location.search);
        // If debug=false is in the URL, disable it and set it in localStorage.
        if (urlParams.get('debug') === 'false') {
            window.localStorage.setItem('debugMode', 'false');
            return false;
        }
        // If debug=true is in the URL, enable it.
        if (urlParams.get('debug') === 'true') {
            window.localStorage.setItem('debugMode', 'true');
            return true;
        }
        // Otherwise, default to ON unless localStorage is explicitly 'false'.
        return window.localStorage.getItem('debugMode') !== 'false';
    } catch (error) {
        console.error("Could not access localStorage for debug mode", error);
        return false; // Fallback to off if localStorage fails
    }
};

const DEBUG_ENABLED = isDebugMode();

const COLORS: { [key: string]: string } = {
    STATE: '#8850C3',       // Purple
    API: '#00A0A0',         // Teal
    API_REQUEST: '#00A0A0', // Teal
    API_RESPONSE: '#00B8B8',// Light Teal
    LIFECYCLE: '#D9AD00',   // Yellow
    EVENT: '#D95E00',       // Orange
    SPEECH: '#0082D9',      // Blue
    ERROR: '#D92626',       // Red
    WARN: '#D98300',        // Amber
    INFO: '#4a5568',        // Gray
    DATA: '#38A169',        // Green
    AUTH: '#3182CE',        // Blue
    GAMIFICATION: '#e53e3e' // Red
};

export const debug = (namespace: keyof typeof COLORS, message: string, ...data: any[]) => {
    if (DEBUG_ENABLED) {
        const color = COLORS[namespace] || '#000000';
        console.log(
            `%c[${namespace}]`,
            `color: white; background-color: ${color}; padding: 2px 5px; border-radius: 3px; font-weight: bold;`,
            message,
            ...data
        );
    }
};

if (typeof window !== 'undefined') {
    (window as any).enableDebugging = () => {
        window.localStorage.setItem('debugMode', 'true');
        console.log("Debugging enabled. Refresh page or add ?debug=true to URL.");
        window.location.reload();
    };
    (window as any).disableDebugging = () => {
        window.localStorage.setItem('debugMode', 'false');
        console.log("Debugging disabled. Refresh page or add ?debug=false to URL.");
        window.location.reload();
    };
    if (DEBUG_ENABLED) {
        console.log("Debug mode is ON. Call window.disableDebugging() or use ?debug=false in the URL to turn it off.");
    } else {
        console.log("Debug mode is OFF. Call window.enableDebugging() or use ?debug=true in the URL to turn it on.");
    }
}
