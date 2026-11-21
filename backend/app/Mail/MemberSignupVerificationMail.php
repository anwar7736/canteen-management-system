<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class MemberSignupVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $name,
        public string $canteenName,
        public string $otp
    ) {
    }

    public function build(): self
    {
        return $this
            ->subject('Verify your email to join '.$this->canteenName)
            ->view('emails.member_signup_verification');
    }
}
