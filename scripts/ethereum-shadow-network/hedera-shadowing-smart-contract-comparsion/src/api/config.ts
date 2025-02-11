import axios from 'axios';
const ERIGON_API_HOST = process.env.ERIGON_API_HOST;

export const axiosInstanceErigon = axios.create({
	baseURL: `http://${ERIGON_API_HOST}:9545/`,
	headers: {
		'Content-Type': 'application/json',
	},
});

export const axiosInstanceHederaRpcApi = axios.create({
	baseURL: 'http://localhost:7546/',
	headers: {
		'Content-Type': 'application/json',
	},
});

export const axiosReceiptApi = axios.create({
	baseURL: 'http://localhost:9000/',
	headers: {
		'Content-Type': 'application/json',
	},
})
