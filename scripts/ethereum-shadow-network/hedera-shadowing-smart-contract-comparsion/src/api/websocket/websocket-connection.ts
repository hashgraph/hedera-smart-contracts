import WebSocket from 'isomorphic-ws';
import EventEmitter from 'events';
import dotenv from 'dotenv';

dotenv.config();
const SHADOWING_API_HOST = process.env.SHADOWING_API_HOST;

export const websocketEvents = new EventEmitter();

export function websocketConnection() {
	const socket = new WebSocket(`ws://${SHADOWING_API_HOST}:8085/`);

	socket.onopen = () => {
		console.log('WebSocket connection opened');
	};

	socket.onmessage = (event) => {
		try {
			if (typeof event.data === 'string') {
				const data = JSON.parse(event.data);
				websocketEvents.emit('websocket', data);
			}
		} catch (error) {
			console.error('Error parsing JSON:', error);
		}
	};

	socket.onerror = (error) => {
		console.error('WebSocket error:', error);
	};

	socket.onclose = () => {
		console.log('WebSocket connection closed');
	};

	return socket;
}
