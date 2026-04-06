import PixelBlast from "./components/PixelBlast"
import MetallicPaint from "./components/MetallicPaint"
import { useGoogleLogin } from "@react-oauth/google"
import BorderGlow from "./components/BorderGlow"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import logo from './assets/logo.svg'

function CustomGoogleButton() {
  const login = useGoogleLogin({
    onSuccess: (response) => console.log('Logged in!', response),
    onError: () => console.log('Login Failed'),
  })

  return (
    <button
      onClick={() => login()}
      className="flex items-center justify-center gap-3 px-4 py-3 bg-transparent rounded-lg w-full"
    >
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      <span className="text-white text-sm font-medium">Google</span>
    </button>
  )
}

function CustomAppleButton() {
  const handleAppleLogin = () => {
    // @ts-ignore
    AppleID.auth.init({
      clientId: 'YOUR_APPLE_CLIENT_ID',
      scope: 'name email',
      redirectURI: 'http://localhost:5173',
      usePopup: true,
    })
    // @ts-ignore
    AppleID.auth.signIn()
  }

  return (
    <button
      onClick={handleAppleLogin}
      className="flex items-center justify-center gap-3 px-4 py-3 bg-transparent rounded-lg w-full"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.39-1.32 2.76-2.54 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
          fill="rgba(255,255,255,0.85)"
        />
      </svg>
      <span className="text-white text-sm font-medium">Apple</span>
    </button>
  )
}

export default function App() {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black">

      {/* Mobile background */}
      <div className="absolute inset-0 md:hidden">
        <PixelBlast
          variant="circle"
          pixelSize={4}
          color="#77148a"
          patternScale={2}
          patternDensity={1}
          pixelSizeJitter={0}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid={false}
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={0.5}
          edgeFade={0.25}
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Left — animation */}
      <div className="hidden md:flex items-center justify-center w-1/2 h-full p-6">
        <div className="w-full h-full rounded-2xl overflow-hidden">
          <PixelBlast
            variant="circle"
            pixelSize={4}
            color="#9333ea"
            patternScale={2}
            patternDensity={1}
            pixelSizeJitter={0}
            enableRipples
            rippleSpeed={0.4}
            rippleThickness={0.12}
            rippleIntensityScale={1.5}
            liquid={false}
            liquidStrength={1.12}
            liquidRadius={100.2}
            liquidWobbleSpeed={5}
            speed={0.5}
            edgeFade={0.25}
          />
        </div>
      </div>

      <div className="relative z-10 flex flex-col w-full md:w-1/2 h-full overflow-y-hidden">

        <div style={{
          width: '700px',
          height: '330px',
          marginLeft: '-55px',
          marginTop: '-60px',
          overflow: 'hidden',
          transform: 'rotate(8deg)',
          transformOrigin: 'left center',
          flexShrink: 0
        }}>
          <MetallicPaint
            imageSrc={logo}
            seed={42}
            scale={2}
            patternSharpness={0.2}
            noiseScale={2.5}
            speed={0.45}
            liquid={0.25}
            mouseAnimation={false}
            brightness={2.45}
            contrast={0.52}
            refraction={0.02}
            blur={0.05}
            chromaticSpread={1}
            fresnel={1}
            angle={1}
            waveAmplitude={1}
            distortion={1}
            contour={0.2}
            lightColor="#3D0080"
            darkColor="#000000"
            tintColor="#8B2BE2"
          />
        </div>

        <div className="flex flex-col flex-1 px-10 md:px-16" style={{marginTop: '1px'}}>

          <div className="mb-6">
            <h1 className="text-4xl font-semibold text-white leading-tight tracking-tight" style={{marginLeft: '100px', fontFamily: 'DM Sans'}}>
              Welcome Back
            </h1>
            <p className="text-white/40 text-sm mt-1 tracking-wide" style={{marginLeft: '139px', fontFamily: 'DM Sans'}}>
              Please log in to continue.
            </p>
          </div>

          <div className="flex gap-3 w-full max-w-sm mb-4" style={{marginLeft: '20px', fontFamily: 'DM Sans'}}>
            <div className="flex-1">
              <BorderGlow
                edgeSensitivity={30}
                glowColor="45 10 110"
                backgroundColor="#060010"
                borderRadius={12}
                glowRadius={40}
                glowIntensity={1}
                coneSpread={25}
                animated={false}
                colors={['#6d28d9', '#a21caf', '#8B2BE2', '#9333ea']}
              >
                <CustomGoogleButton />
              </BorderGlow>
            </div>
            <div className="flex-1">
              <BorderGlow
                edgeSensitivity={30}
                glowColor="45 10 110"
                backgroundColor="#060010"
                borderRadius={12}
                glowRadius={40}
                glowIntensity={1}
                coneSpread={25}
                animated={false}
                colors={['#6d28d9', '#a21caf', '#8B2BE2', '#9333ea']}
              >
                <CustomAppleButton />
              </BorderGlow>
            </div>
          </div>

          <div className="flex items-center gap-3 max-w-sm mb-4" style={{marginLeft: '20px', fontFamily: 'DM Sans'}}>
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="flex flex-col gap-3 max-w-sm" style={{marginLeft: '20px', fontFamily: 'DM Sans'}}>

            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-purple-500 transition-colors"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-purple-500 transition-colors pr-10"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-purple-400 transition-colors"
              >
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

            {/* ✅ Navigate to /home on Continue */}
            <button
              onClick={() => navigate('/home')}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Continue
            </button>

            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-white/30 text-xs">Forgot your password?</span>
              <a href="#" className="text-white/50 text-xs underline hover:text-purple-400 transition-colors">
                Reset Your Password
              </a>
            </div>

            <div className="h-px bg-white/10" />

            <div className="flex items-center justify-center gap-1">
              <span className="text-white/30 text-xs">Don't have an account?</span>
              <a href="#" className="text-white/50 text-xs underline hover:text-purple-400 transition-colors">
                Register
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}