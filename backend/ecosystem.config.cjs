module.exports = {
  apps: [
    {
      name: "dvsk-website",
      script: "npm",
      args: "run dev",
      watch: false,
      // This hides the black CMD window!
      env: {
        PM2_SERVE_PATH: '.',
        PM2_SERVE_PORT: 3000, 
      }
    }
  ]
}