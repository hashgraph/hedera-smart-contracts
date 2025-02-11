import * as winston from 'winston';
import DailyRotateFile, {
	DailyRotateFileTransportOptions,
} from 'winston-daily-rotate-file';

/**
 * An abstract class for creating a rotated file logger using Winston.
 * This logger will create separate log files for each log level and rotate them based on the specified max size.
 *
 * @template T - The type of the message to be logged.
 * @template L - The type of the log levels, e.g: 'info'.
 */
abstract class RotatedFileLogger<T, L extends string = string> {
	private readonly logger: winston.Logger;

	constructor(
		dirname: string,
		filename: string,
		extension: string,
		format: winston.Logform.Format,
		levels: L[],
		maxSize: DailyRotateFileTransportOptions['maxSize'] = '10m'
	) {
		this.logger = this.createLogger(
			dirname,
			filename,
			extension,
			format,
			maxSize,
			levels
		);
	}

	private createLogger(
		dirname: string,
		filename: string,
		extension: string,
		format: winston.Logform.Format,
		maxSize: DailyRotateFileTransportOptions['maxSize'],
		levels: L[]
	) {
		const transports = levels.map(
			(level) =>
				new DailyRotateFile({
					datePattern: 'YYYY-MM-DD HH:mm',
					dirname: `${dirname}/${level}`,
					filename: `%DATE%-${level}-${filename}.${extension}`,
					maxSize,
					format,
					level,
				})
		);

		return winston.createLogger({
			format: format,
			transports,
		});
	}

	protected abstract parse(message: T): string;

	protected log(level: L, message: T) {
		this.logger.log(level, this.parse(message));
	}
}

// EXAMPLE IMPLEMENTATION

/**
 * A class for creating a rotated CSV file logger using Winston.
 * It will accept an array of any type as the message and parse it for logging.
 * One instance of this class will log to one file (with levels distinction).
 *
 * @argument dirname - The directory where the log files will be stored.
 * @argument filename - The name of the log files.
 */
export class CsvLogger extends RotatedFileLogger<any[], 'info' | 'error'> {
	constructor(
		dirname: string,
		filename: string,
		maxSize?: DailyRotateFileTransportOptions['maxSize']
	) {
		super(
			dirname,
			filename,
			'csv',
			winston.format.printf(({ message }) => `${message}`),
			['info', 'error'],
			maxSize
		);
	}

	protected parse(array: any[]) {
		return array.join(',');
	}

	info(message: any[]) {
		super.log('info', message);
	}

	error(message: any[]) {
		super.log('error', message);
	}
}

// EXAMPLE USAGE
export const TRANSACTION_CHECKER_LOGGER = new CsvLogger(
	'logs/transaction-checker',
	'transaction-checker'
);
