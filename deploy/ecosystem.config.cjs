module.exports = {
  apps: [
    {
      name: 'salon-api',
      cwd: './backend',
      script: 'dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'salon-bot',
      cwd: './bot',
      script: 'dist/bot.js',
      instances: 1,
    },
  ],
};
