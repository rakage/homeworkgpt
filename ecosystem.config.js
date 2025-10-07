module.exports = {
  apps: [
    {
      name: "homeworkgpt",
      script: "npm",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        HUMANIZER_CONCURRENCY: 2,
        HUMANIZER_HEADLESS: true,
        HUMANIZER_MAX_RETRIES: 3,
        HUMANIZER_JOB_TIMEOUT: 120000
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
