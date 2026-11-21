<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email verification</title>
</head>
<body>
    <p>Hello {{ $name }},</p>
    <p>Use this code to verify your email and request membership at {{ $canteenName }}:</p>
    <h2>{{ $otp }}</h2>
    <p>This code expires in 10 minutes. Your account will need approval from the canteen admin before you can sign in.</p>
    <p>{{ config('app.name') }} Support</p>
</body>
</html>
