import fs from 'fs';
import { format } from 'date-fns';

const activeStream: {
	fileStream: fs.WriteStream | null;
	fileNumber: number | null;
} = {
	fileStream: null,
	fileNumber: null,
};

export function writeLogFile(
	filePath: string,
	data: any,
	withTimeStamp = true,
	fileFormat: 'csv' | 'txt' | 'json' = 'csv',
	fileNumber = 0
) {
	const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm');

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

	activeStream.fileStream?.write(
		`${withTimeStamp ? `${timestamp}:` : ''} ${data}`
	);
}
