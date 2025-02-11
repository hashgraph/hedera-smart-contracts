export function getCurrentTimestamp(): { consensus_timestamp: number } {
	const unixTimestamp = Math.floor(Date.now() / 1000);
	return { consensus_timestamp: unixTimestamp };
}
