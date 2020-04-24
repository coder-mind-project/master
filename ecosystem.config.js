module.exports = {
  apps: [
    {
      name: 'masterDevelop',
      script: 'index.js',
      watch: true,
      env: {
        PORT: 3000,
        NODE_ENV: 'development'
      }
    }
  ]
}
