import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { componentTagger } from "sandbox-tagger";
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
// @ts-ignore
export default defineConfig(({ mode }) => {

  // Set the default value of INSPECTOR_URL according to environment settings.
  const getDefaultInspectorUrl = () => {
    // If the environment variable VITE_INSPECTOR_URL is already set, use it directly.
    // if (env.VITE_INSPECTOR_URL) {
    //   return env.VITE_INSPECTOR_URL;
    // }

    // If not set, determine the default based on the mode
    // if (mode === 'development') {
    //   return `http://${env.VITE_INSPECTOR_HOST || 'localhost'}:${env.VITE_INSPECTOR_PORT || '3004'}`;
    // }

    // Default to cdn.zepid.dev for production and other environments
    return 'https://cdn.zepid.dev';
  };

  return {
    server: {
      host: "::",
      port: 5173,
      allowedHosts: true
    },
    plugins: [
      react(),
      tailwindcss(),
      ...(mode === 'development' ? [componentTagger()] : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Define environment variables
    define: {
      'import.meta.env.VITE_INSPECTOR_URL': JSON.stringify(getDefaultInspectorUrl())
    }
  };
});
