<?php

namespace App\Support;

class PaymentUrls
{
    public static function backend(string $path): string
    {
        return self::build(config('app.url'), $path, 'APP_URL');
    }

    public static function frontend(string $path, array $query = []): string
    {
        $url = self::build(config('app.frontend_url'), $path, 'FRONTEND_URL');

        return $query ? $url.'?'.http_build_query($query) : $url;
    }

    public static function isTrustedGatewayUrl(mixed $url): bool
    {
        if (!is_string($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        $parts = parse_url($url);
        $apiParts = parse_url((string) config('sslcommerz.apiDomain'));

        return is_array($parts)
            && is_array($apiParts)
            && strtolower((string) ($parts['scheme'] ?? '')) === 'https'
            && strtolower((string) ($parts['host'] ?? '')) === strtolower((string) ($apiParts['host'] ?? ''))
            && in_array($parts['port'] ?? null, [null, 443], true)
            && !isset($parts['user'])
            && !isset($parts['pass'])
            && !isset($parts['fragment']);
    }

    private static function build(mixed $baseUrl, string $path, string $setting): string
    {
        $parts = is_string($baseUrl) ? parse_url($baseUrl) : false;
        $scheme = is_array($parts) ? strtolower((string) ($parts['scheme'] ?? '')) : '';
        $host = is_array($parts) ? strtolower((string) ($parts['host'] ?? '')) : '';
        $isLocalHttp = in_array($scheme, ['http', 'https'], true)
            && in_array($host, ['localhost', '127.0.0.1', '::1', '[::1]'], true)
            && app()->environment(['local', 'testing']);

        if (
            !is_string($baseUrl)
            || !filter_var($baseUrl, FILTER_VALIDATE_URL)
            || !in_array($scheme, ['http', 'https'], true)
            || $host === ''
            || (!$isLocalHttp && $scheme !== 'https')
            || isset($parts['user'])
            || isset($parts['pass'])
            || isset($parts['query'])
            || isset($parts['fragment'])
        ) {
            abort(503, $setting.' must be configured as a trusted HTTPS URL.');
        }

        return rtrim($baseUrl, '/').'/'.ltrim($path, '/');
    }
}
