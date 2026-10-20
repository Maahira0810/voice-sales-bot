# AI Voice Sales Bot – deploy on Vercel (free) with Groq (free)
Files: index.html (the app), api/chat.js (server function that calls Groq).
1. Create a GitHub repo and upload index.html and api/chat.js (keep the api folder).
2. vercel.com -> Add New Project -> import the repo -> Deploy.
3. Project Settings -> Environment Variables -> GROQ_API_KEY = your Groq key -> Redeploy.
4. Open the https://....vercel.app link in Chrome/Edge and allow the microphone.
Never put the key inside index.html or commit it to GitHub.
