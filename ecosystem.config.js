module.exports = {
  apps: [{
    name: "quiz-app",
    script: "dist/server/index.js",
    instances: "max", // Use maximum number of CPU cores
    exec_mode: "cluster",
    autorestart: true,
    watch: false,
    max_memory_restart: "1G", // Restart if memory usage exceeds 1GB
    env: {
      NODE_ENV: "production",
      PORT: 5000,
      HOST: "0.0.0.0"
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 5000,
      HOST: "0.0.0.0"
    },
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    error_file: "logs/error.log",
    out_file: "logs/output.log",
    merge_logs: true
  }]
};