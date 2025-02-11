import fs from 'fs';

const activeStream: {
	fileStream: fs.WriteStream | null;
	fileNumber: number | null;
} = {
	fileStream: null,
	fileNumber: null,
};

export async function writeLogFile(
	filePath: string,
	data: any,
	fileFormat: 'csv' | 'txt' | 'json' = 'csv',
	fileNumber = 0
) {
	if (fileNumber !== activeStream.fileNumber) {
		if (activeStream.fileStream) {
			activeStream.fileStream.end();
		}
	}

	const pathBuilder = `${fileNumber > 0 ? `${filePath}-${fileNumber}.${fileFormat}` : `${filePath}.${fileFormat}`}`;
	activeStream.fileStream = fs.createWriteStream(pathBuilder, {
		encoding: 'utf8',
		flags: 'a',
	});
	activeStream.fileNumber = fileNumber;

	activeStream.fileStream?.write(`${data}`);
}
