<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\OTPModel;
use App\Mail\AdminVerification;
use Hash;
use Mail;

class LoginController extends Controller
{
    public function onLogin(Request $req)
    {
        $validated = $req->validate([
            'username' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
        ]);
        $username = $validated['username'];
        $password = $validated['password'];
        $user_info = User::where('username', $username)->first();

        if (!$user_info || $user_info->role !== 'user' || !Hash::check($password, $user_info->password)) {
            return 0;
        }

        if ($user_info->status !== 'active') {
            return 'inactive';
        }

        $user = $user_info->toArray();
        $user['api_token'] = $user_info->createToken('user-panel', ['user'])->plainTextToken;

        return ['user', $user];
    }

    public function AdminLogin(Request $req)
    {
        $validated = $req->validate([
            'username' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
        ]);
        $admin = User::where('username', $validated['username'])->first();

        if (!$admin || $admin->role !== 'admin' || $admin->status !== 'active' || !Hash::check($validated['password'], $admin->password)) {
            return 0;
        }

        $user = $admin->toArray();
        $user['api_token'] = $admin->createToken('admin-panel', ['admin'])->plainTextToken;

        return $user;
    }
}

