<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{{ $title ?? 'Verification' }}</title>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: 'Segoe UI', sans-serif;
    background: #0b0b0b;
    color: #fff;
}

.wrapper {
    display: flex;
    min-height: 100vh;
}

/* LEFT SIDE (GYM IMAGE) */
.left-panel {
    flex: 1;
    background: 
        linear-gradient(to right, rgba(0,0,0,0.2), rgba(0,0,0,0.85)),
        url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1400&auto=format&fit=crop');
    background-size: cover;
    background-position: center;
    position: relative;
}

/* RIGHT SIDE */
.right-panel {
    flex: 1;
    background: linear-gradient(135deg, #111111, #1a1a1a);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
}

.card {
    max-width: 420px;
    width: 100%;
}

.badge {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 50px;
    font-size: 13px;
    margin-bottom: 20px;
    font-weight: 600;
}

.success {
    background: rgba(34,197,94,0.15);
    border: 1px solid rgba(34,197,94,0.4);
    color: #22c55e;
}

.error {
    background: rgba(239,68,68,0.15);
    border: 1px solid rgba(239,68,68,0.4);
    color: #ef4444;
}

h1 {
    font-size: 38px;
    margin-bottom: 15px;
    font-weight: 800;
    letter-spacing: 1px;
}

p {
    color: #cfcfcf;
    line-height: 1.6;
    margin-bottom: 25px;
}

/* DARK ORANGE BUTTON */
.btn {
    display: inline-block;
    padding: 14px 24px;
    border-radius: 12px;
    background: #ff8c00;
    color: #000;
    font-weight: 700;
    text-decoration: none;
    transition: 0.25s ease;
}

.btn:hover {
    background: #ffa733;
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(255,140,0,0.35);
}

.footer-text {
    margin-top: 20px;
    font-size: 13px;
    color: #9b9b9b;
}

/* MOBILE */
@media(max-width: 900px){
    .wrapper { flex-direction: column; }
    .left-panel { height: 250px; }
}
</style>
</head>

<body>
<div class="wrapper">

    <div class="left-panel"></div>

    <div class="right-panel">
        <div class="card">

            @if(!empty($ok))
                <div class="badge success">Verified</div>
            @else
                <div class="badge error">Verification Failed</div>
            @endif

            <h1>{{ $title ?? 'Verification' }}</h1>

            <p>{{ $message ?? '' }}</p>

            <a class="btn" href="http://localhost:5173/login">Go to Login</a>

            <div class="footer-text">
                ExerSearch — Train Smarter 💪
            </div>

        </div>
    </div>

</div>
</body>
</html>