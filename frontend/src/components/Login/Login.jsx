import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { requestOtp, verifyOtp, setToken } from '../../api/client';
import styles from './Login.module.css';

/**
 * Login page — OTP via Telegram
 *
 * Flow:
 *  1. User clicks "Enviar código a Telegram"
 *  2. Backend sends a 6-digit OTP to Guille's Telegram
 *  3. User enters the code and clicks "Verificar"
 *  4. On success → JWT saved → redirect to app
 */
export default function Login() {
  const [step, setStep] = useState('request'); // 'request' | 'verify'
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  // ─── Step 1: Request OTP ────────────────────────────────────────────────
  const handleRequestOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      await requestOtp();
      setStep('verify');
      setSuccess('Código enviado a Telegram');
    } catch (err) {
      setError(err.message || 'No se pudo enviar el código. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ─────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Introduce los 6 dígitos del código');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { token } = await verifyOtp(code);
      setToken(token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Código incorrecto o expirado');
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend OTP ─────────────────────────────────────────────────────────
  const handleResend = async () => {
    setCode('');
    setError(null);
    setSuccess(null);
    await handleRequestOtp();
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/kai-avatar.svg" alt="Kai" className={styles.avatar} />
        <h1 className={styles.title}>Kai Devia</h1>
        <p className={styles.subtitle}>Tu mano derecha técnica</p>

        {error && <div className={styles.error}>{error}</div>}
        {success && step === 'verify' && (
          <div className={styles.successMsg}>{success}</div>
        )}

        {/* ── Step 1: Send code ── */}
        {step === 'request' && (
          <button
            className={styles.primaryButton}
            onClick={handleRequestOtp}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.btnContent}><RefreshCw size={16} className={styles.spinning} /> Solicitando...</span>
            ) : (
              'Acceder'
            )}
          </button>
        )}

        {/* ── Step 2: Enter code ── */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyOtp} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="otp-code">Código de 6 dígitos</label>
              <input
                id="otp-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className={styles.codeInput}
              />
            </div>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <span className={styles.btnContent}><RefreshCw size={16} className={styles.spinning} /> Verificando...</span>
              ) : (
                <span className={styles.btnContent}><CheckCircle size={16} /> Verificar</span>
              )}
            </button>

            <button
              type="button"
              className={styles.resendLink}
              onClick={handleResend}
              disabled={loading}
            >
              Reenviar código
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
