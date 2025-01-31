# Hedera Shadowing smart contract comparison and shadowing api

First step to run shadowing app, but second part to check transaction status and compare a smart contract values and slots

## Requirements
* [Node.js](https://nodejs.org/en) >= 22.x
* [PNPM](https://pnpm.io/) >= 9.x
* [Docker](https://www.docker.com/) > 24.x
* [Docker Compose](https://docs.docker.com/compose/) > 2.22.0
* Minimum 16GB RAM

## Usage

Add ```logs``` directory in the root of the project for log files
Create a ```.env``` file in the root of project and add all variables as in ```.env.example```. 

``SHADOWING_API_HOST`` - address for the shadowing api 
``MIRROR_NODE_API_HOST`` - address for the mirror node api
``ERIGON_API_HOST``: - address for the erigon api

If you use docker compose - change all the variables with names of the docker containers, like in ``.env.example`` file
if not, change it to ``localhost`` To connect with the erigon api use the virtual machine or local ip.

### Installation
To run this project you have first download and install all require packages.

## Shadowing API
An api which create a websocket connection to listen incoming requests from the transaction checker app

The shadowing api will be default set on the ports:
- 3005 - Shadowing api
- 8005 - Shadowing api connection listener

### Smart contract comparison and transaction details
Checks all transaction details and comparing smart contract slots values. The app listen a websocket on 8005 port

## Before running this app, make sure Hedera local node is running

## Docker - for both apps
``docker compose up -d``

## Creating logs
The Hedera shadowing smart contract comparison is creating logs for the smart contract details and created hedera transaction details
- Hedera transaction details (It adds a index for each .csv file every 500000 transactions)
- Smart contract compare errors
- All contract details

The log file is in the ``/logs`` directory. When shadowing and transaction checkers apps are running the data will be added into existing log files.

