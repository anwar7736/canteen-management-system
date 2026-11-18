<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
</head>
<body>
    <span><b>Hi</b></span> <span style="color:gray">{{$data['name']}},</span>
    <p>
        Welcome to our Canteen Management System. <br/>Now you are our new registered customer.<br/>
        <br/>        
        <h3>Registration Date : {{$data['reg_date']}}<h3>
        <h3>Your Token No : {{$data['token_no']}}<h3>
        <h3>Password setup URL : {{$data['login_url']}}<h3>
        <h3>Username : {{$data['username']}}<h3>
        <p>For your security, your password is not included in this email. Use the password setup link to verify your email and choose a password.</p>

        <br/>
        <hr/>
        Thanks for registering!
        <br/>
        <br/>
        <b style="color:green">Best Regards,</b><br/>
        {{env('APP_NAME')}} Support Team
    </p>
</body>
</html>