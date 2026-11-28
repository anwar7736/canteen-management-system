import React, {useEffect, useState} from 'react';
import {Button, Card, Form} from 'react-bootstrap';
import {QRCodeSVG} from 'qrcode.react';
import Axios from 'axios';
import API from '../api/API';
import {getFormError} from '../utils/formValidation';

function TwoFactorSecurity() {
    const [enabled, setEnabled] = useState(false);
    const [secret, setSecret] = useState('');
    const [otpauthUrl, setOtpauthUrl] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    useEffect(() => {
        Axios.get(API.TwoFactorStatus)
            .then((response) => setEnabled(Boolean(response.data?.enabled)))
            .catch((requestError) => setError(getFormError(requestError)))
            .finally(() => setLoading(false));
    }, []);

    async function beginSetup() {
        setPending(true);
        setError('');
        setNotice('');
        try {
            const response = await Axios.post(API.TwoFactorSetup);
            setSecret(response.data.secret);
            setOtpauthUrl(response.data.otpauth_url);
        } catch (requestError) {
            setError(getFormError(requestError));
        } finally {
            setPending(false);
        }
    }

    async function confirmSetup(event) {
        event.preventDefault();
        setPending(true);
        setError('');
        setNotice('');
        try {
            await Axios.post(API.TwoFactorConfirm, {code});
            setEnabled(true);
            setSecret('');
            setOtpauthUrl('');
            setCode('');
            setNotice('Two-factor authentication is enabled.');
        } catch (requestError) {
            setError(getFormError(requestError));
        } finally {
            setPending(false);
        }
    }

    async function disable(event) {
        event.preventDefault();
        setPending(true);
        setError('');
        setNotice('');
        try {
            await Axios.post(API.TwoFactorDisable, {code});
            setEnabled(false);
            setSecret('');
            setOtpauthUrl('');
            setCode('');
            setNotice('Two-factor authentication has been disabled.');
        } catch (requestError) {
            setError(getFormError(requestError));
        } finally {
            setPending(false);
        }
    }

    async function copySecret() {
        try {
            await navigator.clipboard.writeText(secret);
            setNotice('Setup key copied to clipboard.');
        } catch (clipboardError) {
            console.error('Unable to copy the authenticator setup key:', clipboardError);
            setError('Clipboard access is unavailable. Select and copy the setup key manually.');
        }
    }

    return (
        <div className="container animated zoomIn security-settings">
            <Card className="security-settings-card">
                <Card.Body>
                    <p className="security-eyebrow">Account security</p>
                    <h2>Two-factor authentication</h2>
                    <p className="text-secondary">
                        Protect sign-in with a time-based code from an authenticator app.
                    </p>
                    {loading ? <p>Loading security settings…</p> : (
                        <>
                            <div className={`security-status ${enabled ? 'is-enabled' : 'is-disabled'}`}>
                                {enabled ? 'Enabled' : 'Not enabled'}
                            </div>
                            {!enabled && !secret && (
                                <Button variant="success" onClick={beginSetup} disabled={pending}>
                                    {pending ? 'Preparing setup…' : 'Set up authenticator'}
                                </Button>
                            )}
                            {!enabled && secret && (
                                <Form onSubmit={confirmSetup}>
                                    <div className="two-factor-setup">
                                        <div className="two-factor-qr">
                                            <QRCodeSVG value={otpauthUrl} size={200} includeMargin />
                                        </div>
                                        <div>
                                            <h3>Scan the QR code</h3>
                                            <p>Use an authenticator app, or enter this setup key manually.</p>
                                            <code className="two-factor-secret">{secret}</code>
                                            <Button type="button" variant="outline-secondary" size="sm" onClick={copySecret}>
                                                Copy setup key
                                            </Button>
                                        </div>
                                    </div>
                                    <Form.Group className="mt-3">
                                        <Form.Label htmlFor="two-factor-confirm-code">6-digit authenticator code</Form.Label>
                                        <Form.Control
                                            id="two-factor-confirm-code"
                                            value={code}
                                            onChange={(event) => {
                                                setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                                                setError('');
                                            }}
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                            isInvalid={Boolean(error)}
                                            aria-invalid={Boolean(error)}
                                        />
                                    </Form.Group>
                                    <Button className="mt-3" type="submit" variant="success" disabled={pending || code.length !== 6}>
                                        {pending ? 'Verifying…' : 'Verify and enable'}
                                    </Button>
                                </Form>
                            )}
                            {enabled && (
                                <Form className="two-factor-disable" onSubmit={disable}>
                                    <p>Enter a current authenticator code to turn this feature off.</p>
                                    <Form.Group>
                                        <Form.Label htmlFor="two-factor-disable-code">Authenticator code</Form.Label>
                                        <Form.Control
                                            id="two-factor-disable-code"
                                            value={code}
                                            onChange={(event) => {
                                                setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                                                setError('');
                                            }}
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                            isInvalid={Boolean(error)}
                                            aria-invalid={Boolean(error)}
                                        />
                                    </Form.Group>
                                    <Button className="mt-3" type="submit" variant="outline-danger" disabled={pending || code.length !== 6}>
                                        {pending ? 'Updating…' : 'Disable two-factor authentication'}
                                    </Button>
                                </Form>
                            )}
                        </>
                    )}
                    {error && <p className="field-error mt-3" role="alert">{error}</p>}
                    {notice && <p className="text-success mt-3" role="status">{notice}</p>}
                </Card.Body>
            </Card>
        </div>
    );
}

export default TwoFactorSecurity;
