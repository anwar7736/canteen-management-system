<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\AdminProfile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
class AdminProfileController extends Controller
{
    public function GetProfileInfo()
    {
        return AdminProfile::query()->limit(1)->get();
    }

    public function GetPublicProfileInfo()
    {
        return AdminProfile::query()->limit(1)->get(['shop_name', 'shop_logo']);
    }

    public function UpdateAdminProfile(Request $req)
    {
        $admin = $req->user();
        $validated = $req->validate([
            'shop_name' => ['required', 'string', 'max:255'],
            'shop_address' => ['nullable', 'string', 'max:1000'],
            'shop_owner' => ['nullable', 'string', 'max:255'],
            'username' => ['nullable', 'string', 'max:255', Rule::unique('users', 'username')->ignore($admin->getKey())],
            'owner_phone' => ['nullable', 'string', 'max:255', Rule::unique('users', 'phone')->ignore($admin->getKey())],
            'shop_logo' => ['nullable', 'image', 'max:2048'],
        ]);
        $shopOwner = $validated['shop_owner'] ?: $admin->name;
        $username = $validated['username'] ?: $admin->username;
        $ownerPhone = $validated['owner_phone'] ?: $admin->phone;

        return DB::transaction(function () use ($req, $admin, $validated, $shopOwner, $username, $ownerPhone) {
            $profile = AdminProfile::updateOrCreate(
                ['owner_email' => $admin->email],
                [
                    'shop_name' => $validated['shop_name'],
                    'shop_address' => $validated['shop_address'] ?? null,
                    'shop_owner' => $shopOwner,
                    'username' => $username,
                    'owner_phone' => $ownerPhone,
                    'owner_email' => $admin->email,
                ]
            );

            if ($req->hasFile('shop_logo')) {
                $logoPath = $req->file('shop_logo')->store('branding', 'public');
                $profile->shop_logo = url(Storage::disk('public')->url($logoPath));
                $profile->save();
            }

            $admin->forceFill([
                'name' => $shopOwner,
                'username' => $username,
                'phone' => $ownerPhone,
            ])->save();

            return 1;
        });
    }
}
