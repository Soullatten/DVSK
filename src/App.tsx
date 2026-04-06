import PixelBlast from "./components/PixelBlast"
import MetallicPaint from "./components/MetallicPaint"
import { GoogleLogin } from "@react-oauth/google"
import logo from './assets/logo.svg'

export default function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black">

      
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
            liquidStrength={0.12}
            liquidRadius={1.2}
            liquidWobbleSpeed={5}
            speed={0.5}
            edgeFade={0.25}
          />
        </div>
      </div>

      {/* Right — content */}
      <div className="relative z-10 flex flex-col w-full md:w-1/2 h-full px-8 md:px-12 py--20">

        {/* Logo at top */}
        <div style={{ width: '800px', height: '300px' }}>
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

        {/* Center content — pushed slightly above middle */}
        <div className="flex flex-col flex-1 justify-center gap-6 pb-24">

          

      
          {/* Google Button */}
          <GoogleLogin
          onSuccess={(credentialResponse) => {
          console.log('Logged in!', credentialResponse)
      }}
        onError={() => {
        console.log('Login Failed')
      }}
        theme="filled_black"
        size="large"
        shape="rectangular"
        text="continue_with"
        logo_alignment="left"
        width="200"
/>

          <p className="text-white/30 text-sm">
            By signing in you agree to our Terms and Privacy Policy.
          </p>

        </div>
      </div>

    </div>
  )
}