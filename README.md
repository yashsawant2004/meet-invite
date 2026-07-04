# Gift Invite

A small interactive Flask page: an envelope she can open, a "No" button she
can never actually click, and a calendar so she can pick a date — which gets
saved straight to your machine.

## Run it

```bash
pip install -r requirements.txt
python app.py
```

Then open **http://localhost:5000** in a browser (or send that link to her
if you're both on the same network, or deploy it — see below — to get a
real public link).

## Where her answer goes — check this page

Every time she picks a date and hits "Lock it in", it's saved on the server.
To see it, open:

```
http://localhost:5000/responses?key=changeme123
```

(replace `localhost:5000` with wherever you deployed it, e.g.
`https://your-app-name.onrender.com/responses?key=changeme123`)

This shows every date she's picked, newest first — just reload the page to
check for new answers. **Change `changeme123`** to your own secret by
setting an `ADMIN_KEY` environment variable (or editing `ADMIN_KEY` in
`app.py`) before you deploy, so nobody else can view it.

The same data is also saved to `responses.json` in this folder and printed
in the terminal where `app.py` is running, if you'd rather check there.

### If you're not seeing anything show up

This almost always means the page she opened wasn't actually being served
by the Flask app — for example, if it was uploaded to a static-file host
(like GitHub Pages or Netlify's default deploy) instead of a host that runs
Python. Flask needs a host that can execute `app.py` continuously, such as
Render, PythonAnywhere, or Railway (see below). Double check: with
`python app.py` running in a terminal you can see, the terminal should
print `[gift-invite] New date picked...` right after she submits. If it
doesn't print anything, the request isn't reaching the server at all.

## Optional: also get an email the moment she submits

If you want an email notification too (in addition to `responses.json`),
set these environment variables before running the app:

```bash
export MAIL_USERNAME="your_gmail_address@gmail.com"
export MAIL_APP_PASSWORD="your_16_character_app_password"
export MAIL_TO="yashsawant390@gmail.com"   # already the default
python app.py
```

`MAIL_APP_PASSWORD` is a Gmail **App Password**, not your normal Gmail
password — generate one at https://myaccount.google.com/apppasswords
(requires 2-Step Verification to be turned on). If you skip this step
entirely, the app still works fine — it just won't send an email, only
save to `responses.json`.

## Sending her the link

`localhost` only works on your own computer. To let her open it from her
phone, either:
- Be on the same Wi-Fi and share `http://<your-computer's-local-IP>:5000`, or
- Deploy it somewhere free like Render, PythonAnywhere, or Railway, then
  send her that public URL.

## Project structure

```
gift-invite/
├── app.py              # Flask server + /submit route
├── requirements.txt
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```
