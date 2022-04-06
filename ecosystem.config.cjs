module.exports = {
  apps : [{
    name   : "btc_generator",
    script : "./index.js",
    log: "./logs/console.log",
    output: "/dev/null",
    error: "/dev/null",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    autorestart: false
  }]
}
