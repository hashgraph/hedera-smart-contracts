import shell from 'shelljs';
import { writeLogFile } from '@/utils/helpers/write-log-file';

export async function resetHederaLocalNode() {
	writeLogFile(
		`logs/network_node_service_error_log`,
		'Network Node Error Appeared \r\n',
		true,
		'txt'
	);

	console.log(
		'Consensus Network Node Error Appeared. Resets hedera local node...'
	);
	shell.exec(
		'hedera restart RELAY_CHAIN_ID=11155111 -d --dev -a --verbose --detached'
	);
	shell.exec(
		'docker volume prune --force'
	);
	await new Promise((resolve) => setTimeout(resolve, 300000));
	console.log('hedera is running');
	writeLogFile(
		`logs/network_node_service_error_log`,
		'Network Node is Running again \r\n',
		true,
		'txt'
	);
}
