import express from 'express'
import contractValue from './routes/contract-value';
import { WebSocket, WebSocketServer } from 'ws';
const port = 8085;

const wss = new WebSocketServer({ port: port });

const app = express();
app.use(express.json());
app.use('/contract-value', contractValue(wss) )

wss.on('connection', (ws: WebSocket) => {
	console.log('A new client connected.');

	ws.on('error', console.error)

	ws.on('message', (message) => {
		console.log('Received message:', message.toString());

		wss.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(`CONNECTION SUCESS', ${message.toString()}`);
			}
		})
	})

	ws.on('close', () => {
		wss.on('close', () => console.log('Connection closed'));
	})
})

app.listen(3005, () => {
	console.log('Listening on port ' + 3005);
})
