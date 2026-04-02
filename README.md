# Consultation Site

## What changed

- Clients can choose the timezone they want to see before selecting a slot.
- Available dates are converted on the server from the consultant timezone in `assets/data/availability.json`.
- Every submitted appointment sends an email notification to the consultant.

## Edit availability

Update `assets/data/availability.json`.

- `sourceTimezone` is the consultant timezone used as the base schedule.
- Each `date` and `timeSlots` entry is interpreted in that timezone.

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

## Email setup

1. Copy `.env.example` to `.env`.
2. Fill in your SMTP settings.
3. Set `APPOINTMENT_NOTIFICATION_EMAIL` to the email address where you want booking notifications.

## node_modules

`node_modules` was created by running:

`npm.cmd install`

You do not need to copy the `node_modules` folder to another PC.
On another computer, open this project folder and run:

`npm.cmd install`

That command reads `package.json` and `package-lock.json` and recreates `node_modules` automatically.

## Run locally

1. Install dependencies:
   `npm.cmd install`
2. Start the server:
   `npm.cmd start`
3. Open:
   `http://localhost:3000`

## Notes

- Do not open `consultation.html` directly by double-clicking it anymore. Use the local server instead.
- The email uses the client's selected timezone and also includes the consultant timezone for clarity.
