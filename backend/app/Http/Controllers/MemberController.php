<?php

namespace App\Http\Controllers;

use App\Billing\TenantMemberCapacity;
use App\Mail\RegistrationMail;
use App\Models\User;
use App\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class MemberController extends Controller
{
    public function __construct(private TenantMemberCapacity $memberCapacity)
    {
    }

    public function AllMembers()
    {
        return User::where('role', 'user')->orderBy('id')->get();
    }

    public function AddNewMember(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:255', 'unique:users,phone'],
            'role' => ['required', Rule::in(['user', 'admin'])],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'address' => ['nullable', 'string', 'max:1000'],
            'photo' => ['nullable', 'image', 'max:2048'],
        ]);

        do {
            $tokenNo = random_int(111111, 999999);
        } while (User::where('token_no', $tokenNo)->exists());

        $tenantId = app(TenantContext::class)->id();
        if (!$tenantId) {
            abort(400, 'A tenant context is required.');
        }
        $member = DB::transaction(function () use ($validated, $tokenNo, $tenantId) {
            if ($validated['role'] === 'user') {
                $this->memberCapacity->assertCanAddMember($tenantId);
            }

            return User::create([
                'token_no' => $tokenNo,
                'name' => $validated['name'],
                'username' => $validated['username'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'role' => $validated['role'],
                'status' => $validated['status'],
                'password' => Hash::make($validated['password']),
                'address' => $validated['address'] ?? null,
            ]);
        });

        if ($request->hasFile('photo')) {
            $member->photo = $this->storePhoto($request, $member);
            $member->save();
        }

        Mail::to($member->email)->send(new RegistrationMail([
            'name' => $member->name,
            'reg_date' => $member->created_at->format('Y-m-d'),
            'token_no' => $member->token_no,
            'login_url' => rtrim(config('app.frontend_url'), '/').'/email_verification',
            'username' => $member->username,
        ]));

        return 1;
    }

    public function ViewMemberById(int $user_id)
    {
        $user = User::findOrFail($user_id);

        return [
            'name' => $user->name,
            'username' => $user->username,
            'token_no' => $user->token_no,
            'email' => $user->email,
            'phone' => $user->phone,
            'photo' => $user->photo,
            'address' => $user->address,
            'status' => $user->status,
            'role' => $user->role,
            'reg_date' => $user->created_at->format('d-m-Y'),
        ];
    }

    public function EditMember(Request $request)
    {
        $id = $request->input('id');
        $validated = $request->validate([
            'id' => ['required', 'integer', 'exists:users,id'],
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', Rule::unique('users', 'username')->ignore($id)],
            'password' => ['nullable', 'string', 'min:8', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($id)],
            'phone' => ['required', 'string', 'max:255', Rule::unique('users', 'phone')->ignore($id)],
            'role' => ['required', Rule::in(['user', 'admin'])],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'token_no' => ['required', 'integer', 'between:111111,999999'],
            'address' => ['nullable', 'string', 'max:1000'],
            'photo' => ['nullable', 'image', 'max:2048'],
        ]);

        if (User::where('token_no', $validated['token_no'])->where('id', '<>', $id)->exists()) {
            return response()->json(['message' => 'Token number already exists.'], 422);
        }

        $member = User::findOrFail($id);
        $promotingToMember = $member->role !== 'user' && $validated['role'] === 'user';
        $updateMember = function () use ($member, $validated): void {
            $member->fill([
                'token_no' => $validated['token_no'],
                'name' => $validated['name'],
                'username' => $validated['username'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'role' => $validated['role'],
                'status' => $validated['status'],
                'address' => $validated['address'] ?? null,
            ]);

            if (!empty($validated['password'])) {
                $member->password = Hash::make($validated['password']);
            }

            $member->save();
        };

        if ($promotingToMember) {
            DB::transaction(function () use ($member, $updateMember) {
                $this->memberCapacity->assertCanAddMember((int) $member->tenant_id);
                $updateMember();
            });
        } else {
            $updateMember();
        }

        if ($request->hasFile('photo')) {
            $member->photo = $this->storePhoto($request, $member);
            $member->save();
        }

        return 1;
    }

    public function DeleteMember(int $user_id, Request $request)
    {
        $member = User::whereKey($user_id)->where('role', 'user')->firstOrFail();

        if ((string) $member->getKey() === (string) $request->user()->getKey()) {
            abort(403);
        }

        if ($member->photo) {
            $this->deleteStoredPhoto($member->photo);
        }

        return $member->delete();
    }

    private function storePhoto(Request $request, User $member): string
    {
        $path = $request->file('photo')->store('profiles', 'public');
        if ($member->photo) {
            $this->deleteStoredPhoto($member->photo);
        }

        return url(Storage::disk('public')->url($path));
    }

    private function deleteStoredPhoto(string $photoUrl): void
    {
        $path = parse_url($photoUrl, PHP_URL_PATH);
        if (is_string($path) && str_starts_with($path, '/storage/')) {
            Storage::disk('public')->delete(substr($path, strlen('/storage/')));
        }
    }
}
