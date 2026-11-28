<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function GetUserProfile(Request $request, int $id): array
    {
        $user = $request->user();
        abort_unless((int) $user->getKey() === $id, 403);

        return $this->profileData($user);
    }

    public function UpdateProfile(Request $request): array
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', Rule::unique('users')->ignore($user->getKey())],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->getKey())],
            'phone' => ['required', 'string', 'max:30', Rule::unique('users')->ignore($user->getKey())],
            'address' => ['required', 'string', 'max:2000'],
            'photo' => ['nullable', 'image', 'max:2048'],
        ]);

        $oldPhoto = null;
        if ($request->hasFile('photo')) {
            $oldPhoto = $user->photo;
            $validated['photo'] = Storage::disk('public')->url(
                $request->file('photo')->store('profiles', 'public')
            );
        } else {
            unset($validated['photo']);
        }

        $user->fill($validated);
        $user->save();

        if ($oldPhoto) {
            $oldPath = parse_url($oldPhoto, PHP_URL_PATH);
            if (is_string($oldPath) && str_starts_with($oldPath, '/storage/')) {
                Storage::disk('public')->delete(substr($oldPath, strlen('/storage/')));
            }
        }

        return $this->profileData($user->fresh());
    }

    private function profileData($user): array
    {
        return [
            'name' => $user->name,
            'username' => $user->username,
            'token_no' => $user->token_no,
            'email' => $user->email,
            'phone' => $user->phone,
            'photo' => $user->photo,
            'address' => $user->address,
            'reg_date' => $user->created_at?->format('d-m-Y'),
        ];
    }
}
