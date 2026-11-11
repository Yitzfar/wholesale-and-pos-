# Wholesale & POS

Deploy the app to Render with one click:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Yitzfar/wholesale-and-pos-)

Render will build the Vite frontend and start the Express server. Once deployment finishes, open the URL Render provides.

**Optional AI features:** In the Render service settings, add `GEMINI_API_KEY` as an environment variable to enable Gemini-powered features. The app can also run without it.

**Note:** App data is currently held in memory, so it resets when the service restarts. Add a persistent database before using this for real sales or inventory.
