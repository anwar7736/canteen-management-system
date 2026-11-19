<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TenantSignupVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $name,
        public string $otp
    ) {
    }

    public function build(): self
    {
        return $this
            ->subject('Verify your email for '.config('app.name'))
            ->view('emails.tenant_signup_verification');
    }
}
