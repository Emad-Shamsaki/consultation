# Consultation Site

This project is now a static website.
You can host it on GitHub Pages or any simple static hosting service and connect your own domain without running a backend server.

## How booking emails work now

The booking form uses Formspree.
Formspree receives the form submission and sends the email for you, so you do not need Node.js, SMTP, or a local server.

## Files you will edit

### 1. Consultant schedule

Edit:
`assets/data/availability.json`

- `sourceTimezone` is your own timezone.
- Every `date` and `timeSlots` value is interpreted in that timezone.
- The website converts those times in the browser to the client's selected timezone.

Example:

```json
{
  "sourceTimezone": "Europe/Rome",
  "availableDates": [
    {
      "date": "2026-04-06",
      "timeSlots": ["09:00", "11:00", "14:00"]
    }
  ]
}
```

### 2. Email form endpoint

Edit:
`assets/data/site-config.json`

Replace:

```json
{
  "formEndpoint": "https://formspree.io/f/your-form-id"
}
```

with your real Formspree endpoint.

Example:

```json
{
  "formEndpoint": "https://formspree.io/f/abcdexyz"
}
```

## Formspree setup

1. Go to `https://formspree.io/`
2. Create an account.
3. Create a new form.
4. Copy your form endpoint.
   It looks like:
   `https://formspree.io/f/abcdexyz`
5. Paste that endpoint into:
   `assets/data/site-config.json`

After that, submitted consultations will be sent to the email connected to your Formspree form.

## Local preview

Because the site reads JSON files, do not preview it by double-clicking the HTML file.
Use a simple static preview server instead.

Examples:

### Option 1: VS Code Live Server

Open the folder in VS Code and start Live Server.

### Option 2: Python

If Python is installed:

```powershell
python -m http.server 8080
```

Then open:

`http://localhost:8080`

This is only for previewing locally.
It is not a backend server for production.

## Deploy to GitHub Pages

1. Create a GitHub repository.
2. Upload this project.
3. In GitHub, open:
   `Settings > Pages`
4. Under `Build and deployment`, choose:
   `Deploy from a branch`
5. Select your main branch and the root folder.
6. Save.

GitHub Pages will give you a site URL.

## Use your own domain

After GitHub Pages is working:

1. Buy a domain from any registrar.
2. In your GitHub repository, open:
   `Settings > Pages`
3. Add your custom domain there.
4. Update your domain DNS records at your registrar using the values GitHub Pages shows.

GitHub custom domain documentation:
https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages

## Notes

- No Node.js backend is required anymore.
- `.env` and SMTP settings are no longer used by this version.
- If the form says it cannot send, first check `assets/data/site-config.json` and confirm your Formspree endpoint is correct.
