<?php
namespace App\Library\SslCommerz;

abstract class AbstractSslCommerz implements SslCommerzInterface
{
    protected $apiUrl;
    protected $storeId;
    protected $storePassword;

    protected function setStoreId($storeID)
    {
        $this->storeId = $storeID;
    }

    protected function getStoreId()
    {
        return $this->storeId;
    }

    protected function setStorePassword($storePassword)
    {
        $this->storePassword = $storePassword;
    }

    protected function getStorePassword()
    {
        return $this->storePassword;
    }

    protected function setApiUrl($url)
    {
        $this->apiUrl = $url;
    }

    protected function getApiUrl()
    {
        return $this->apiUrl;
    }

    /**
     * @param $data
     * @param array $header
     * @param bool $setLocalhost
     * @return bool|string
     */
    public function callToApi($data, $header = [], $setLocalhost = false)
    {
        if (!$this->isTrustedSslCommerzUrl($this->getApiUrl())) {
            return 'FAILED TO CONNECT WITH SSLCOMMERZ API';
        }

        $curl = curl_init();
        if ($curl === false) {
            return 'FAILED TO CONNECT WITH SSLCOMMERZ API';
        }

        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 2);

        curl_setopt($curl, CURLOPT_URL, $this->getApiUrl());
        curl_setopt($curl, CURLOPT_HEADER, 0);
        curl_setopt($curl, CURLOPT_HTTPHEADER, $header);
        curl_setopt($curl, CURLOPT_TIMEOUT, 60);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);

        curl_setopt($curl, CURLOPT_POST, 1);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $data);

        $response = curl_exec($curl);
        $code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $curlErrorNo = curl_errno($curl);
        curl_close($curl);

        if ($code === 200 && !$curlErrorNo && $response !== false) {
            return $response;
        }

        return 'FAILED TO CONNECT WITH SSLCOMMERZ API';
    }

    protected function isTrustedSslCommerzUrl(?string $url): bool
    {
        if (!is_string($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        $parts = parse_url($url);
        $host = strtolower((string) ($parts['host'] ?? ''));

        return is_array($parts)
            && strtolower((string) ($parts['scheme'] ?? '')) === 'https'
            && in_array($host, ['sandbox.sslcommerz.com', 'securepay.sslcommerz.com'], true)
            && in_array($parts['port'] ?? null, [null, 443], true)
            && !isset($parts['user'])
            && !isset($parts['pass']);
    }

    /**
     * @param $response
     * @param string $type
     * @param string $pattern
     * @return false|mixed|string
     */
    public function formatResponse($response, $type = 'checkout', $pattern = 'json')
    {
        $sslcz = json_decode($response, true);
        if (!is_array($sslcz)) {
            $sslcz = [];
        }

        if ($type != 'checkout') {
            return $sslcz;
        } else {
            if (isset($sslcz['GatewayPageURL']) && $sslcz['GatewayPageURL'] != "") {
                // this is important to show the popup, return or echo to send json response back
                if($this->getApiUrl() != null && $this->getApiUrl() == 'https://securepay.sslcommerz.com') {
                   $response = json_encode(['status' => 'SUCCESS', 'data' => $sslcz['GatewayPageURL'], 'logo' => $sslcz['storeLogo']]);
                } else {
                    $response = json_encode(['status' => 'success', 'data' => $sslcz['GatewayPageURL'], 'logo' => $sslcz['storeLogo']]);
                }
            } else {
                $response = json_encode([
                    'status' => 'fail',
                    'data' => null,
                    'message' => $sslcz['failedreason'] ?? 'Invalid response from SSLCommerz.',
                ]);
            }

            if ($pattern == 'json') {
                return $response;
            } else {
                echo $response;
            }
        }
    }

    /**
     * @param $url
     * @param bool $permanent
     */
    public function redirect($url, $permanent = false)
    {
        header('Location: ' . $url, true, $permanent ? 301 : 302);

        exit();
    }
}
