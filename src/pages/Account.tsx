// ──── Components ──────────────────────────────────────────────────────────────

import PixelBlast from "../components/PixelBlast"
import MetallicPaint from "../components/MetallicPaint"
import BorderGlow from "../components/BorderGlow"
import { useState, useRef } from "react"

// ──── Navigation ──────────────────────────────────────────────────────────────
import { useNavigate } from "react-router-dom"

// ──── Images ──────────────────────────────────────────────────────────────
import logo from '../assets/logo.svg'


// ──── Authentication ──────────────────────────────────────────────────────────────

import { auth } from "../firebase"
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth"
import type { ConfirmationResult } from "firebase/auth"
import { authApi } from "../api/auth"

// Shared post-auth sync — after Firebase auth succeeds (Google or phone),
// call the backend to upsert the user in our DB so admin's Customer
// Database sees them with email/phone/avatar populated. Backend reads
// these from the verified Firebase token, so we don't have to re-send them.
async function syncUserToBackend() {
  try {
    const user = auth.currentUser
    if (!user) return
    const token = await user.getIdToken()
    await authApi.login(token).catch(async () => {
      // First-time login → register instead. Backend's
      // verifyAndGetUser handles both, but the explicit /register
      // path returns a clearer 201 response.
      await authApi.register(token, user.displayName || undefined)
    })
  } catch (err) {
    // Don't block navigation on backend sync failure — user is still
    // authenticated client-side; the next API call will retry.
    console.warn("Backend user sync failed:", err)
  }
}

function CustomGoogleButton({ onSuccess }: { onSuccess: () => void }) {
  const [busy, setBusy] = useState(false)
  const handleClick = async () => {
    if (busy) return
    setBusy(true)
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope("profile")
      provider.addScope("email")
      // Tell Google to always show the account picker so the user can
      // explicitly choose which account they want, even if they're
      // already signed into Google in this browser.
      provider.setCustomParameters({ prompt: "select_account" })

      // signInWithPopup waits for the Google OAuth popup to complete and
      // signs the user into Firebase in one shot.
      const result = await signInWithPopup(auth, provider)

      if (result?.user) {
        // Backend sync is fire-and-forget — we DON'T block navigation
        // on it because if the backend is briefly down or the auth/login
        // endpoint hiccups, the user is still authenticated client-side
        // and should see the logged-in UI immediately. Their record
        // gets created on the next authenticated API call.
        void syncUserToBackend()
        onSuccess()
      }
    } catch (err: any) {
      // Surface a real error message instead of silently swallowing —
      // that was why "the popup closes and nothing happens" before.
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        // User intentionally closed the popup — silent.
        return
      }
      let msg = err?.message || "Google sign-in failed. Please try again."
      if (err?.code === "auth/popup-blocked") msg = "Popup was blocked. Please allow popups and try again."
      if (err?.code === "auth/unauthorized-domain") msg = "This domain isn't allowed. Add it to Firebase Auth → Authorized Domains."
      if (err?.code === "auth/account-exists-with-different-credential") msg = "An account already exists with a different sign-in method. Try Phone OTP or email."
      console.error("Google sign-in failed:", err)
      alert(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="flex items-center justify-center gap-3 px-4 py-3 bg-transparent rounded-lg w-full disabled:opacity-50"
    >
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      <span className="text-white text-sm font-medium">{busy ? "Signing in…" : "Google"}</span>
    </button>
  )
}

function CustomPhoneButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-3 px-4 py-3 bg-transparent rounded-lg w-full"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z"
          fill="rgba(255,255,255,0.85)"
        />
      </svg>
      <span className="text-white text-sm font-medium">Phone</span>
    </button>
  )
}

function LoginForm({ onRegister, onPhoneClick }: { onRegister: () => void, onPhoneClick: () => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <div className="mb-6">
        <h1 className="text-4xl font-semibold text-white leading-tight tracking-tight" style={{ marginLeft: '100px', fontFamily: 'DM Sans' }}>
          Welcome Back
        </h1>
        <p className="text-white/40 text-sm mt-1 tracking-wide" style={{ marginLeft: '139px', fontFamily: 'DM Sans' }}>
          Please log in to continue.
        </p>
      </div>

      <div className="flex gap-3 w-full max-w-sm mb-4" style={{ marginLeft: '20px', fontFamily: 'DM Sans' }}>
        <div className="flex-1">
          <BorderGlow edgeSensitivity={30} glowColor="45 10 110" backgroundColor="#060010" borderRadius={12} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#6d28d9', '#a21caf', '#8B2BE2', '#9333ea']}>
            <CustomGoogleButton onSuccess={() => navigate('/home')} />
          </BorderGlow>
        </div>
        <div className="flex-1">
          <BorderGlow edgeSensitivity={30} glowColor="45 10 110" backgroundColor="#060010" borderRadius={12} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#6d28d9', '#a21caf', '#8B2BE2', '#9333ea']}>
            <CustomPhoneButton onClick={onPhoneClick} />
          </BorderGlow>
        </div>
      </div>

      <div className="flex items-center gap-3 max-w-sm mb-4" style={{ marginLeft: '20px', fontFamily: 'DM Sans' }}>
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/30 text-xs">OR</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <div className="flex flex-col gap-3 max-w-sm" style={{ marginLeft: '20px', fontFamily: 'DM Sans' }}>
        <input type="email" placeholder="Email" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#ffebab]/60 transition-colors" />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#ffebab]/60 transition-colors pr-10"
          />
          <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#ffebab] transition-colors">
            {showPassword ? (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        <button onClick={() => navigate('/home')} className="w-full py-3 bg-[#ffebab] hover:bg-[#ffe199] text-black text-sm font-semibold rounded-lg transition-colors">
          Continue
        </button>

        <div className="flex items-center justify-center gap-1 mt-1">
          <span className="text-white/30 text-xs">Forgot your password?</span>
          <a href="#" className="text-white/50 text-xs underline hover:text-[#ffebab] transition-colors">Reset Your Password</a>
        </div>

        <div className="h-px bg-white/10" />

        <div className="flex items-center justify-center gap-1">
          <span className="text-white/30 text-xs">Don't have an account?</span>
          <button onClick={onRegister} className="text-white/50 text-xs underline hover:text-[#ffebab] transition-colors">Register</button>
        </div>
      </div>
    </>
  )
}

function PhoneForm({ onBack }: { onBack: () => void }) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const navigate = useNavigate()

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      })
    }
  }

  const handleSendOtp = async () => {
    setError('')
    if (!phone || phone.length < 10) return setError('Enter a valid 10-digit number')
    try {
      setLoading(true)
      setupRecaptcha()
      const verifier = (window as any).recaptchaVerifier
      const confirmation = await signInWithPhoneNumber(auth, `+91${phone}`, verifier)
      confirmationRef.current = confirmation
      setOtpSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
      ;(window as any).recaptchaVerifier = null
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setError('')
    if (!otp || otp.length !== 6) return setError('Enter the 6-digit OTP')
    try {
      setLoading(true)
      await confirmationRef.current?.confirm(otp)
      // Same shared sync as the Google button — pushes the new phone-only
      // user into our backend DB so they show up in the admin Customer
      // Database with their phone number on file.
      await syncUserToBackend()
      navigate('/home')
    } catch (err: any) {
      setError('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = () => {
    ;(window as any).recaptchaVerifier = null
    setOtpSent(false)
    setOtp('')
    setError('')
  }

  return (
    <>
      <div id="recaptcha-container" />

      <div className="mb-6">
        <h1 className="text-4xl font-semibold text-white leading-tight tracking-tight" style={{ marginLeft: '100px', fontFamily: 'DM Sans' }}>
          Phone Login
        </h1>
        <p className="text-white/40 text-sm mt-1 tracking-wide" style={{ marginLeft: '108px', fontFamily: 'DM Sans' }}>
          We'll send you a one-time code.
        </p>
      </div>

      <div className="flex flex-col gap-3 max-w-sm" style={{ marginLeft: '20px', fontFamily: 'DM Sans' }}>

        {error && (
          <p className="text-red-400 text-xs px-1">{error}</p>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value="+91"
            disabled
            className="w-16 px-3 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm text-center opacity-60"
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            disabled={otpSent}
            className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#ffebab]/60 transition-colors disabled:opacity-50"
          />
        </div>

        {otpSent && (
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            maxLength={6}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#ffebab]/60 transition-colors tracking-widest"
          />
        )}

        {!otpSent ? (
          <button
            onClick={handleSendOtp}
            disabled={loading}
            className="w-full py-3 bg-[#ffebab] hover:bg-[#ffe199] disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        ) : (
          <button
            onClick={handleVerifyOtp}
            disabled={loading}
            className="w-full py-3 bg-[#ffebab] hover:bg-[#ffe199] disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        )}

        {otpSent && (
          <div className="flex items-center justify-center">
            <button onClick={handleResend} className="text-white/30 text-xs hover:text-[#ffebab] transition-colors">
              Resend OTP
            </button>
          </div>
        )}

        <div className="h-px bg-white/10" />

        <div className="flex items-center justify-center">
          <button onClick={onBack} className="text-white/50 text-xs underline hover:text-[#ffebab] transition-colors">
            ← Back to Login
          </button>
        </div>
      </div>
    </>
  )
}

function RegisterForm({ onLogin }: { onLogin: () => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <div className="mb-6">
        <h1 className="text-4xl font-semibold text-white leading-tight tracking-tight" style={{ marginLeft: '100px', fontFamily: 'DM Sans' }}>
          Create Account
        </h1>
        <p className="text-white/40 text-sm mt-1 tracking-wide" style={{ marginLeft: '118px', fontFamily: 'DM Sans' }}>
          Join us — it only takes a minute.
        </p>
      </div>

      <div className="flex gap-3 w-full max-w-sm mb-4" style={{ marginLeft: '20px', fontFamily: 'DM Sans' }}>
        <div className="flex-1">
          <BorderGlow edgeSensitivity={30} glowColor="45 10 110" backgroundColor="#060010" borderRadius={12} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#6d28d9', '#a21caf', '#8B2BE2', '#9333ea']}>
            <CustomGoogleButton onSuccess={() => navigate('/home')} />
          </BorderGlow>
        </div>
      </div>

      <div className="flex items-center gap-3 max-w-sm mb-4" style={{ marginLeft: '20px', fontFamily: 'DM Sans' }}>
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/30 text-xs">OR</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <div className="flex flex-col gap-3 max-w-sm" style={{ marginLeft: '20px', fontFamily: 'DM Sans' }}>
        <div className="flex gap-2">
          <input type="text" placeholder="First name" className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#ffebab]/60 transition-colors" />
          <input type="text" placeholder="Last name" className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#ffebab]/60 transition-colors" />
        </div>

        <input type="email" placeholder="Email" className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#ffebab]/60 transition-colors" />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#ffebab]/60 transition-colors pr-10"
          />
          <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#ffebab] transition-colors">
            {showPassword ? (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            ) : (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            )}
          </button>
        </div>

        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm password"
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#ffebab]/60 transition-colors pr-10"
          />
          <button onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-[#ffebab] transition-colors">
            {showConfirm ? (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            ) : (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            )}
          </button>
        </div>

        <button onClick={() => navigate('/home')} className="w-full py-3 bg-[#ffebab] hover:bg-[#ffe199] text-black text-sm font-semibold rounded-lg transition-colors">
          Create Account
        </button>

        <div className="h-px bg-white/10" />

        <div className="flex items-center justify-center gap-1">
          <span className="text-white/30 text-xs">Already have an account?</span>
          <button onClick={onLogin} className="text-white/50 text-xs underline hover:text-[#ffebab] transition-colors">Log In</button>
        </div>
      </div>
    </>
  )
}

export default function App() {
  const [view, setView] = useState<'login' | 'register' | 'phone'>('login')

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black">

      <div className="absolute inset-0 md:hidden">
        <PixelBlast variant="circle" pixelSize={4} color="#77148a" patternScale={2} patternDensity={1} pixelSizeJitter={0} enableRipples rippleSpeed={0.4} rippleThickness={0.12} rippleIntensityScale={1.5} liquid={false} liquidStrength={0.12} liquidRadius={1.2} liquidWobbleSpeed={5} speed={0.5} edgeFade={0.25} />
        {/* Right edge fade */}
        <div style={{
            position: "absolute",
            top: 0, right: 0,
            width: "60%", height: "100%",
            background: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 60%, #000000 100%)",
            zIndex: 1, pointerEvents: "none",
        }} />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="hidden md:flex items-center justify-center w-1/2 h-full p-6">
        <div className="w-full h-full rounded-2xl overflow-hidden">
          <PixelBlast variant="circle" pixelSize={4} color="#9333ea" patternScale={2} patternDensity={1} pixelSizeJitter={0} enableRipples rippleSpeed={0.4} rippleThickness={0.12} rippleIntensityScale={1.5} liquid={false} liquidStrength={1.12} liquidRadius={100.2} liquidWobbleSpeed={5} speed={0.5} edgeFade={0.25} />
        </div>
      </div>

      <div className="relative z-10 flex flex-col w-full md:w-1/2 h-full overflow-y-hidden">
        <div style={{ width: '700px', height: '330px', marginLeft: '-55px', marginTop: '-60px', overflow: 'hidden', transform: 'rotate(8deg)', transformOrigin: 'left center', flexShrink: 0 }}>
          <MetallicPaint imageSrc={logo} seed={42} scale={2} patternSharpness={0.2} noiseScale={2.5} speed={0.45} liquid={0.25} mouseAnimation={false} brightness={2.45} contrast={0.52} refraction={0.02} blur={0.05} chromaticSpread={1} fresnel={1} angle={1} waveAmplitude={1} distortion={1} contour={0.2} lightColor="#3D0080" darkColor="#000000" tintColor="#8B2BE2" />
        </div>

        <div className="flex flex-col flex-1 px-6 sm:px-10 md:px-16" style={{ marginTop: '1px' }}>
          {view === 'login' && <LoginForm onRegister={() => setView('register')} onPhoneClick={() => setView('phone')} />}
          {view === 'register' && <RegisterForm onLogin={() => setView('login')} />}
          {view === 'phone' && <PhoneForm onBack={() => setView('login')} />}
        </div>
      </div>
    </div>
  )
}