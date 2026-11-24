KRILLION — GEMINI AI JUDGE SETUP
================================

This package connects KRILLION's answer checker to Google's Gemini API.
The API key stays on Netlify's server and is NOT placed in index.html.

WHAT YOU NEED
-------------
- Your Google AI Studio API key
- A free Netlify account: https://app.netlify.com/
- A GitHub account: https://github.com/ (to deploy the server function reliably)

STEP 1 — PUT THE PROJECT ON GITHUB
----------------------------------
1. Unzip this package on your computer.
2. Open https://github.com/new and create a new repository named krillion.
   You can leave it Public or Private; either works.
3. Open the new repository and choose Add file > Upload files.
4. Open the unzipped krillion_gemini_site folder on your computer.
5. Upload the CONTENTS of that folder, keeping the folder structure:
     index.html
     netlify.toml
     README.txt
     netlify/functions/judge.js
6. Commit the upload.

STEP 2 — CONNECT THE REPOSITORY TO NETLIFY
------------------------------------------
1. Open https://app.netlify.com/ and sign in.
2. Choose Add new project > Import an existing project.
3. Choose GitHub and authorize Netlify if asked.
4. Select your krillion repository.
5. In build settings, use:
     Build command: (leave blank)
     Publish directory: .
   The included netlify.toml also specifies the publish and functions folders.
6. Choose Deploy.

STEP 3 — ADD YOUR GEMINI KEY PRIVATELY
--------------------------------------
1. In Netlify, open your new site's dashboard.
2. Go to Site configuration (or Project configuration) > Environment variables.
3. Choose Add a variable.
4. Set the key/name to: GEMINI_API_KEY
5. Paste your Google AI Studio key as the value. Do not add quotation marks.
6. Save the variable.

Optional model variable:
- Name: GEMINI_MODEL
- Value: gemini-3.8-flash
You can skip this; the function already uses that default model.

STEP 4 — REDEPLOY
-----------------
After adding the key, go to Deploys and choose Trigger deploy > Deploy site.
Wait for the deploy to finish, then reload your KRILLION site.

STEP 5 — TEST IT
----------------
Try a prompt such as "Name a mountain range" and enter "Andes Mountains".
The AI judge should be able to accept valid answers even when they are not in
KRILLION's local answer list. The AI also estimates rarity for scoring.

IMPORTANT NOTES
---------------
- Never paste your API key into the HTML file, GitHub, or chat.
- Add the key ONLY as the Netlify environment variable GEMINI_API_KEY.
- The Gemini API may have free usage limits and quotas. If a limit is reached,
  the AI check may temporarily fail; KRILLION's offline answer database still
  works as a fallback.
- Rarity is an AI estimate for gameplay, not a measured global statistic.
- This package has not been live-tested with your private API key.
- Use Git-connected deployment (the steps above) so Netlify builds and deploys
  the serverless function in netlify/functions/judge.js.

HOW TO UPDATE THE GAME
----------------------
If you later change the game, update the files in your GitHub repository.
Netlify will automatically redeploy the site and function after each commit.
Keep netlify/functions/judge.js and netlify.toml in the project.
