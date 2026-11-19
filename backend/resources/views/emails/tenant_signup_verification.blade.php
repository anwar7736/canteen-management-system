<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email verification</title>
</head>
<body>
    <p>Hello {{ $name }},</p>
    <p>Use this code to verify your email address and create your canteen workspace:</p>
    <h2>{{ $otp }}</h2>
    <p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
    <p>{{ config('app.name') }} Support</p>
</body>
</html>
