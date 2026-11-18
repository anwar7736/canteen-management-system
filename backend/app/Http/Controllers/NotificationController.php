<?php

namespace App\Http\Controllers;
use App\Models\User;
use App\Models\Notification as Notify;
use App\Models\NotificationDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Notifications\AdminNotification;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

class NotificationController extends Controller
{
    function SendEmailNotification(Request $req)
    {
        $validated = $req->validate([
            'receivers' => ['required', 'string', 'max:4000'],
            'msg_title' => ['required', 'string', 'max:255'],
            'msg_body' => ['required', 'string', 'max:5000'],
        ]);
        $receivers = $validated['receivers'];
        $msg_title = $validated['msg_title'];
        $msg_body = $validated['msg_body'];

        if($receivers === 'ForAllUser')
        {
            $users = User::where('role', 'user')->get();
            $data = ['title' => $msg_title, 'body' => $msg_body];
            Notification::send($users, new AdminNotification($data));

            return 1;
        }

        $emails = array_values(array_unique(array_filter(array_map('trim', explode(',', $receivers)))));
        if (!$emails || count(array_filter($emails, fn ($email) => filter_var($email, FILTER_VALIDATE_EMAIL))) !== count($emails)) {
            throw ValidationException::withMessages(['receivers' => 'Enter valid recipient email addresses.']);
        }

        $users = User::where('role', 'user')->whereIn('email', $emails)->get();
        Notification::send($users, new AdminNotification([
            'title' => $msg_title,
            'body' => $msg_body,
        ]));

        return 1;
    }

    function InsertNotification(Request $req)
    {
        $validated = $req->validate([
            'msg_title' => ['required', 'string', 'max:255'],
            'msg_body' => ['required', 'string', 'max:5000'],
        ]);
        $author = $req->user();
        $createdAt = now('Asia/Dhaka');

        return DB::transaction(function () use ($author, $validated, $createdAt) {
            if ($author->role !== 'admin' && !User::where('role', 'admin')->exists()) {
                return 0;
            }

            $notificationId = DB::table('notifications')->insertGetId([
                'author_id' => $author->getKey(),
                'author_name' => $author->name,
                'msg_title' => $validated['msg_title'],
                'msg_body' => $validated['msg_body'],
                'create_date' => $createdAt->toDateString(),
                'create_time' => $createdAt->format('H:i:s'),
            ]);

            $recipientIds = $author->role === 'admin'
                ? User::where('role', 'user')->pluck('id')
                : User::where('role', 'admin')->limit(1)->pluck('id');

            if ($recipientIds->isNotEmpty()) {
                $rows = $recipientIds->map(fn ($userId) => [
                    'notification_id' => $notificationId,
                    'user_id' => $userId,
                    'status' => 'Latest',
                    'create_date' => $createdAt->toDateString(),
                    'create_time' => $createdAt->format('H:i:s'),
                ])->all();

                NotificationDetail::insert($rows);
            }

            return 1;
        });
    }

    function GetAllNotificationForAdmin(Request $req)
    {
        $notifications = Notify::where('author_id', $req->user()->getKey())
            ->orderByDesc('id')
            ->get();
        return $notifications;
    }

    function EditNotification(Request $req)
    {
        $notify_id = $req->notify_id;
        $validated = $req->validate([
            'notify_id' => ['required', 'integer', 'exists:notifications,id'],
            'msg_title' => ['required', 'string', 'max:255'],
            'msg_body' => ['required', 'string', 'max:5000'],
        ]);
        
        $notification = Notify::findOrFail($validated['notify_id']);
        $notification->msg_title = $validated['msg_title'];
        $notification->msg_body = $validated['msg_body'];
        $notification->save();
        return $notification ? 1 : 0;


    }

    function DeleteNotification(Request $req)
    {
        $validated = $req->validate([
            'notify_id' => ['required', 'integer', 'exists:notifications,id'],
        ]);

        return DB::transaction(function () use ($validated) {
            NotificationDetail::where('notification_id', $validated['notify_id'])->delete();

            return Notify::whereKey($validated['notify_id'])->delete() ? 1 : 0;
        });
    }

    function GetNotification(Request $req)
    {
        $notify_id = $req->notify_id;
        $notification = Notify::where('id', $notify_id)->get();
        return $notification;
    }

    function GetSelfCreatedNotification(Request $req)
    {
        $user_id = $req->user_id;
        $data = DB::table('notifications')
                ->join('notification_details', 'notifications.id', 'notification_details.notification_id')
                ->where('notifications.author_id', $user_id)
                ->select('notifications.*', 'notification_details.status')
                ->orderBy('notifications.id', 'desc')
                ->get();
        return $data;
        
    }

    function GetAdminNotificationByUser(Request $req)
    {
        $user_id = $req->user_id;
        $data = DB::table('notification_details')
                ->join('notifications', 'notification_details.notification_id', 'notifications.id')
                ->where('notification_details.user_id', $user_id)
                ->select('notification_details.*', 'notifications.author_name', 'notifications.msg_title', 'notifications.msg_body')
                ->orderBy('notification_details.id', 'desc')
                ->get();
        return $data;
    }
    
    function CountLastestNotification(Request $req)
    {
        $user_id = $req->user_id;
        $count_latest_row = NotificationDetail::where(['user_id'=>$user_id, 'status'=>'Latest'])->count();
        return $count_latest_row;

    }

    function SetUnreadStatus(Request $req)
    {
        $user_id = $req->user_id;
        $unreadStatus =  NotificationDetail::where(['user_id'=>$user_id, 'status'=>'Latest'])->update(['status' => 'Unread']);
        return $unreadStatus;
    }
    function SetReadStatus(Request $req)
    {
        $user_id = $req->user_id;
        $notification_id = $req->notification_id;
        $unreadStatus =  NotificationDetail::where(['user_id'=>$user_id, 'notification_id'=>$notification_id])->update(['status' => 'Read']);
        return $unreadStatus;
    }
}
