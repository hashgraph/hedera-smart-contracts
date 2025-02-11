module.exports = {
    apps : [{
        name   : "hedera-shadowing-smart-contract-comparison-and-transaction-checker",
        script : "./src/apps/smart-contract-comparison/index.ts",
        error_file  : "./logs/shadowing-smart-contract-comparison-errors-full.log",
        out_file : "./logs/shadowing-smart-contract-comparison-out-full.log",
        log_date_format: "YYYY-MM-DD HH:mm",
        max_memory_restart: '3G',
        autorestart: false
    }]
}
