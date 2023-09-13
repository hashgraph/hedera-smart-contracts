require('dotenv').config();

function delay() {
    return new Promise(resolve => setTimeout(resolve, process.env.RETRY_DELAY || 2000));
}

module.exports = {
    delay
}