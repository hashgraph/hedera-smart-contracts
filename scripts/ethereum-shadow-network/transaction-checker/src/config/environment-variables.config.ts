import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '8081'),
  logToFile: process.env.LOG_TO_FILE || 'false',
  logFilePath: process.env.LOG_FILE_PATH || 'logs',
  logFileName: process.env.LOG_FILE_NAME || 'transactions.log',

  networkWorkers: parseInt(process.env.NETWORK_WORKERS || '128'),
  mirrorWorkers: parseInt(process.env.MIRROR_WORKERS || '64'),
  networkQueueCapacity: parseInt(process.env.NETWORK_QUEUE_CAPACITY || '65536'),
  mirrorQueueCapacity: parseInt(process.env.MIRROR_QUEUE_CAPACITY || '65536'),
  networkUrl: process.env.NETWORK_URL || '127.0.0.1:50211',
  networkAccount: process.env.NETWORK_ACCOUNT || '3',
  operatorAccount: process.env.OPERATOR_ACCOUNT || '2',
  operatorAccountKey: process.env.OPERATOR_ACCOUNT_KEY || '302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137',
  mirrorNodeUrl: process.env.MIRROR_NODE_URL || 'http://127.0.0.1:5551',
  shadowingApiUrl: process.env.SHADOWING_API_URL || 'http://127.0.0.1:3005',
  hederaClientMirrorNetworkUrl: process.env.HEDERA_CLIENT_MIRROR_NETWORK_URL || '127.0.0.1:5600'
};
