<?php

namespace Tests\Unit;

use App\Support\Totp;
use PHPUnit\Framework\TestCase;

class TotpTest extends TestCase
{
    public function test_totp_verifies_rfc_6238_sha1_code_and_rejects_malformed_codes(): void
    {
        $secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

        $this->assertTrue(Totp::verify($secret, '287082', 59));
        $this->assertFalse(Totp::verify($secret, '287083', 59));
        $this->assertFalse(Totp::verify($secret, '12345', 59));
        $this->assertFalse(Totp::verify('invalid-secret', '287082', 59));
    }
}
