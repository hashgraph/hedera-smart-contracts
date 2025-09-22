module.exports = {
    apps : [{
        name   : "hedera-shadowing",
        script : "npm",
        error_file  : "./logs/pm2/errors/hedera-shadowing-errors-full.log",
        out_file : "./logs/pm2/out/hedera-shadowing-out-full.log",
        log_date_format: "YYYY-MM-DD HH:mm",
        max_memory_restart: '5G',
        autorestart: false,
        interpreter: "none",
        args: "run dev",
    }]
}
