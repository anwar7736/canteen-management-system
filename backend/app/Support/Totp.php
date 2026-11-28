<?php

namespace App\Support;

class Totp
{
    private const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    public static function generateSecret(int $bytes = 20): string
    {
        return self::encodeBase32(random_bytes($bytes));
    }

    public static function verify(string $secret, string $code, ?int $timestamp = null): bool
    {
        if (!preg_match('/^\d{6}$/', $code)) {
            return false;
        }

        $key = self::decodeBase32($secret);
        if ($key === '') {
            return false;
        }
        $counter = intdiv($timestamp ?? time(), 30);
        for ($offset = -1; $offset <= 1; $offset++) {
            if (hash_equals(self::codeForCounter($key, $counter + $offset), $code)) {
                return true;
            }
        }

        return false;
    }

    private static function codeForCounter(string $key, int $counter): string
    {
        $message = pack('N2', ($counter >> 32) & 0xffffffff, $counter & 0xffffffff);
        $hash = hash_hmac('sha1', $message, $key, true);
        $offset = ord($hash[strlen($hash) - 1]) & 0x0f;
        $number = (
            ((ord($hash[$offset]) & 0x7f) << 24)
            | ((ord($hash[$offset + 1]) & 0xff) << 16)
            | ((ord($hash[$offset + 2]) & 0xff) << 8)
            | (ord($hash[$offset + 3]) & 0xff)
        ) % 1000000;

        return str_pad((string) $number, 6, '0', STR_PAD_LEFT);
    }

    private static function encodeBase32(string $value): string
    {
        $bits = '';
        foreach (str_split($value) as $character) {
            $bits .= str_pad(decbin(ord($character)), 8, '0', STR_PAD_LEFT);
        }

        $encoded = '';
        foreach (str_split($bits, 5) as $chunk) {
            if (strlen($chunk) === 5) {
                $encoded .= self::BASE32[bindec($chunk)];
            }
        }

        return $encoded;
    }

    private static function decodeBase32(string $value): string
    {
        $bits = '';
        foreach (str_split(strtoupper(rtrim($value, '='))) as $character) {
            $index = strpos(self::BASE32, $character);
            if ($index === false) {
                return '';
            }
            $bits .= str_pad(decbin($index), 5, '0', STR_PAD_LEFT);
        }

        $decoded = '';
        foreach (str_split($bits, 8) as $chunk) {
            if (strlen($chunk) === 8) {
                $decoded .= chr(bindec($chunk));
            }
        }

        return $decoded;
    }
}
