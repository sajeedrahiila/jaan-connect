module.exports = {
  apps: [
    {
      name: 'jaan-api',
      script: './server.ts',
      interpreter: 'tsx',
      instances: 'max',  // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Performance tuning for 200+ users
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=4096',
      watch: false,
      ignore_watch: ['node_modules', 'uploads', 'dist'],
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      merge_logs: true,
      // Monitoring
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
