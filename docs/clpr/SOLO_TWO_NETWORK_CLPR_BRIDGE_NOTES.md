# Two Solo Networks + CLPR Bridging: What We Tried, What Broke, What Must Be True

This document captures the attempts to run the **two-ledger CLPR bridged test** in this repo and the issues encountered along the way, with an emphasis on what is *essential* to make a two-network scenario work reliably (and why it is materially harder than the single-ledger mocked/smoke scenario).

## TL;DR (Current State)

- We got two Solo networks running in parallel (`solo-clpr-src`, `solo-clpr-dst`).
- We got both JSON-RPC relays running and responding to basic JSON-RPC calls.
- The bridged Hardhat test still failed because the JSON-RPC relay depends on Mirror Node for key lookups.
- Mirror Node ingestion did not advance because record stream files were malformed (new `.rcd.gz` files were 10 bytes and no `.rcd_sig` markers appeared).
- Result: relay could not resolve the sender EVM address and rejected `eth_sendRawTransaction` with `Requested resource not found. address '0x…'`.

This is why the single-ledger scenario (Hardhat in-process, or a single Solo network used directly via HAPI/gRPC) can work while the two-ledger scenario (two relays + two mirrors + cross-ledger relayer) fails.

## Primary Failing Symptom

- Hardhat test failed when sending transactions via relay JSON-RPC.
- JSON-RPC method: `eth_sendRawTransaction`
- Error (from relay): `Requested resource not found. address '0x…'`

Reproduction command (placeholders):

```bash
export CLPR_SRC_RPC_URL=http://127.0.0.1:7546
export CLPR_DST_RPC_URL=http://127.0.0.1:7547
export CLPR_PRIVATE_KEY=0x<ecdsa-private-key>

npx hardhat test test/network/clpr/clprBridgeRelayedQueue.js --network hardhat
```

## 1) Target Scenario (What We Were Trying To Run)

Test:

- `test/network/clpr/clprBridgeRelayedQueue.js`

What it does (at a high level):

- On the source ledger, it deploys `MockClprRelayedQueue`, `ClprMiddleware`, source connectors, and `SourceApplication`.
- On the destination ledger, it deploys `MockClprRelayedQueue`, `ClprMiddleware`, destination connectors, `OZERC20Mock` (WETH), and `EchoApplication`.
- It then runs a thin relayer loop that ferries ABI-encoded bytes between ledgers by calling queue methods on each network.

This flow requires the ability to submit EVM transactions against both ledgers (two RPC endpoints).

## 2) Environment / Versions (What We Actually Ran)

Local:

- Kubernetes context: `docker-desktop`
- Solo CLI: `solo 0.55.0`

Namespaces (two parallel deployments):

- Source network namespace: `solo-clpr-src`
- Destination network namespace: `solo-clpr-dst`
- Shared Solo setup namespace: `solo-setup` (MinIO operator, etc.)

Consensus node software (inside `network-node1-0`):

```text
VERSION=0.68.7-rc.1
COMMIT=02087eb2
DATE=Mon Jan 26 19:14:12 UTC 2026
```

Mirror node images (each namespace):

- Importer: `gcr.io/mirrornode/hedera-mirror-importer:0.146.0`
- REST: `gcr.io/mirrornode/hedera-mirror-rest:0.146.0`
- REST-Java: `gcr.io/mirrornode/hedera-mirror-rest-java:0.146.0`

Relay image/chart (each namespace):

- Relay chart label indicated: `app.kubernetes.io/version: 0.74.1`

## 3) “Clean Slate” Reset and Dual-Network Bring-Up

We started by deleting old Solo namespaces and re-creating a clean dual-deployment setup.

Cluster-ref setup:

```bash
solo cluster-ref config connect -c solo-clpr --context docker-desktop -q
solo cluster-ref config setup -c solo-clpr -q
```

For each network (src and dst), we used a manual sequence (not `solo one-shot`), roughly:

```bash
solo deployment config create
solo deployment cluster attach -c solo-clpr --num-consensus-nodes 1
solo keys consensus generate --gossip-keys --tls-keys
solo consensus network deploy
solo consensus node setup
solo consensus node start
solo mirror node add --profile tiny
solo relay node add --profile tiny
```

Why manual deployment:

- We needed **two parallel networks** at the same time. `solo one-shot` workflows tend to assume “manage one at a time” semantics (and even if it’s possible, the tooling patterns are primarily optimized for a single environment).

## 4) First Major Problem: Relay CrashLoop Due To Mirror URL / Ingress Assumptions

### 4.1 What failed

The relay (`relay-1`) depends on Mirror Node APIs (examples):

- `/api/v1/accounts/...`
- `/api/v1/network/fees`

Initially, the relay was configured to call a mirror endpoint that did not work in our deployment approach, causing it to crashloop.

Two distinct “mirror ingress” failure modes were observed in the broader work on this repo:

- Mirror ingress controller not installed/used (because we intentionally skipped it), leaving the relay with a non-working default.
- Mirror ingresses exist, but `mirror-ingress-controller` does not route them because of ingress-class/path mismatches (documented separately in `AGENTS.md`).

### 4.2 What we changed to make the relay start

We avoided the ingress-controller dependency entirely and created an in-namespace proxy that the relay could talk to.

Fix we used in both namespaces:

- Create `mirror-relay-proxy` (nginx) that routes `/api/v1/network/*` to `mirror-1-restjava` and `/api/v1/*` to `mirror-1-rest`.
- Patch relay configmaps to point at the proxy (`MIRROR_NODE_URL` and `MIRROR_NODE_URL_WEB3`).
- Reduce relay CPU/mem requests (Docker Desktop scheduling constraints)

Notes:

- We used `ghcr.io/nginxinc/nginx-unprivileged:1.25-alpine` (pulling `docker.io/nginx` intermittently failed with `unexpected EOF`).
- Unprivileged nginx requires a writable pid path, so config included `pid /tmp/nginx.pid;` and listened on `8080`.

Evidence that this part worked:

- Both `relay-1` pods moved to `Running`.
- Basic JSON-RPC methods succeeded (examples we validated): `eth_chainId`, `eth_gasPrice`, `eth_getBlockByNumber`.

### 4.3 Concrete K8s Resources and Patches Used (Mirror Proxy + Relay Config)

The goal of these steps was to give the relay a stable Mirror base URL **without** depending on an ingress controller.

Create `mirror-relay-proxy` in a namespace:

```bash
ns=<solo-namespace>

kubectl -n "$ns" apply -f - <<'YAML'
apiVersion: v1
kind: ConfigMap
metadata:
  name: mirror-relay-proxy-nginx
data:
  default.conf: |
    pid /tmp/nginx.pid;
    events {}
    http {
      server {
        listen 8080;

        # Relay needs /api/v1/network/* endpoints that come from restjava.
        location /api/v1/network/ {
          proxy_pass http://mirror-1-restjava/api/v1/network/;
        }

        # Most other mirror endpoints are served by mirror REST.
        location /api/v1/ {
          proxy_pass http://mirror-1-rest/api/v1/;
        }
      }
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mirror-relay-proxy
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mirror-relay-proxy
  template:
    metadata:
      labels:
        app: mirror-relay-proxy
    spec:
      containers:
        - name: nginx
          image: ghcr.io/nginxinc/nginx-unprivileged:1.25-alpine
          ports:
            - containerPort: 8080
          volumeMounts:
            - name: nginx-conf
              mountPath: /etc/nginx/conf.d/default.conf
              subPath: default.conf
      volumes:
        - name: nginx-conf
          configMap:
            name: mirror-relay-proxy-nginx
---
apiVersion: v1
kind: Service
metadata:
  name: mirror-relay-proxy
spec:
  selector:
    app: mirror-relay-proxy
  ports:
    - name: http
      port: 80
      targetPort: 8080
YAML
```

Patch relay configmaps to point at the proxy (repeat per namespace):

```bash
ns=<solo-namespace>
proxy_url="http://mirror-relay-proxy.${ns}.svc.cluster.local"

kubectl -n "$ns" patch cm relay-1 --type merge -p "{
  \"data\": {
    \"MIRROR_NODE_URL\": \"${proxy_url}\",
    \"MIRROR_NODE_URL_WEB3\": \"${proxy_url}\",
    \"GET_RECORD_DEFAULT_TO_CONSENSUS_NODE\": \"true\"
  }
}"

kubectl -n "$ns" patch cm relay-1-ws --type merge -p "{
  \"data\": {
    \"MIRROR_NODE_URL\": \"${proxy_url}\"
  }
}"

kubectl -n "$ns" rollout restart deploy/relay-1 deploy/relay-1-ws
```

Resource-pressure mitigation (Docker Desktop):

- We reduced relay CPU/memory requests to avoid unschedulable pods.
- The exact values used during troubleshooting: requests `cpu=200m` `memory=256Mi`, limits `cpu=500m` `memory=512Mi` for both `relay-1` and `relay-1-ws`.

### 4.4 Alternate fix (not the one we used)

`AGENTS.md` documents a different approach:

- Patch mirror ingresses to set `spec.ingressClassName=mirror-ingress-class`
- Patch mirror REST/restjava path patterns/types so `mirror-ingress-controller` returns non-404 responses

That fix addresses “relay can’t reach mirror REST correctly”, but it does not address the ingestion blocker described later.

## 5) Second Major Problem: Port-Forward Persistence

Port-forwarding is “easy” interactively, but it’s fragile in automation if you treat it like a background job.

What we learned:

- `kubectl port-forward ... &` started from a non-interactive shell does not remain alive after the shell exits.
- In practice, you need dedicated terminals, or a supervisor process, or stable endpoint exposure (Ingress/NodePort/LoadBalancer).

This matters for ODIN because any agent runner that depends on ephemeral port-forwards must manage them as first-class processes.

## 6) Third Major Problem: Provisioning and Funding the ECDSA Alias Account

The Hardhat bridged test signs and sends EVM transactions using a single private key:

- env var `CLPR_PRIVATE_KEY` (or the first key in `PRIVATE_KEYS`)

Essential requirement:

- That ECDSA key must correspond to an **account that exists and has funds** on *both* ledgers.

What failed / was unreliable:

- `solo ledger account predefined` appeared unreliable in this two-deployment context.
- We observed `ALIAS_ALREADY_ASSIGNED` errors.
- We observed “accounts created but not where expected”, suggesting ambiguous targeting between deployments.

Workaround that was reliable (and also relevant to ODIN):

- Use `@hashgraph/sdk` over consensus node gRPC to create/query accounts directly.
- Even without mirror, the consensus node can resolve an EVM alias to an account number:
- `AccountId.fromEvmAddress(0, 0, <20-byte-hex>)`
- `AccountInfoQuery().setAccountId(<aliasId>)`

Observation (important):

- The mapping “ECDSA key -> Hedera account number” can differ across ledgers.
- But the EVM address is the same, and the node can resolve it via alias lookups.
- The JSON-RPC relay still refused to send transactions when Mirror was not ingesting.

### 6.1 Concrete Port-Forwards Used During Debugging

These are the local endpoints that were used while iterating (they are not meant to be permanent; they were just the simplest way to connect tools locally):

- Source relay JSON-RPC: `kubectl -n solo-clpr-src port-forward svc/relay-1 7546:7546`
- Destination relay JSON-RPC: `kubectl -n solo-clpr-dst port-forward svc/relay-1 7547:7546`
- Source consensus gRPC: `kubectl -n solo-clpr-src port-forward svc/haproxy-node1-svc 50221:50211`
- Destination consensus gRPC: `kubectl -n solo-clpr-dst port-forward svc/haproxy-node1-svc 30212:50211`

### 6.2 gRPC Alias Resolution (Works Even When Mirror Is Stale)

This was a key learning for ODIN:

- The consensus node can resolve an EVM alias to a Hedera account via gRPC.
- Mirror ingestion is not required for this resolution.

Example (pseudo-code, no secrets):

```js
const { Client, PrivateKey, AccountId, AccountInfoQuery } = require('@hashgraph/sdk');

// Map to the node via a local port-forward.
const client = Client.forNetwork({ '127.0.0.1:50221': '0.0.3' });
client.setOperator('0.0.2', PrivateKey.fromStringDer(process.env.OPERATOR_KEY_DER));

const evm = '<20-byte-hex-evm-address-no-0x>';
const aliasId = AccountId.fromEvmAddress(0, 0, evm);
const info = await new AccountInfoQuery().setAccountId(aliasId).execute(client);

console.log('resolved accountId:', info.accountId.toString());
console.log('contractAccountId:', info.contractAccountId);
```

## 7) The Main Blocker: Mirror Ingestion Was Not Advancing

This is the point where the two-ledger scenario became “stuck”.

### 7.1 Symptoms

Mirror importer logs (both ledgers) repeatedly reported:

- `No new signature files to download after file: <timestamp>.rcd.gz`

Mirror REST did not show newly created accounts/transactions.

Hardhat test error:

- `eth_sendRawTransaction` failed with a “resource not found” for the sender address.
- This is consistent with the relay being unable to resolve the sender EVM address to an account via Mirror.

### 7.2 Evidence on the consensus node: record stream files were malformed

On both consensus nodes, the record stream directory contained new record files that were only **10 bytes**:

- `.../recordStreams/record0.0.3/<timestamp>.rcd.gz` size `10`

No corresponding `.rcd_sig` marker file appeared for the new `.rcd.gz` file.

Implication:

- The record-stream uploader sidecar (`record-stream-uploader`) only uploads when it sees a marker (a `.rcd_sig`).
- No marker means no upload to MinIO.
- No upload means mirror importer sees no new signature files.
- Therefore mirror ingestion never advances.

### 7.3 Contrast: events streams were healthy

The same node produced and uploaded event streams correctly:

- `eventsStreams/events_0.0.3/<timestamp>.evts` with normal sizes
- `<timestamp>.evts_sig` marker present
- uploader logs showed successful uploads and local file removal

So:

- MinIO, uploader wiring, and “stream upload” infrastructure were functional.
- The failure was specifically tied to **record stream production/signature emission** on the consensus node side.

### 7.4 Why this breaks JSON-RPC relay

The relay uses Mirror Node for more than “historical queries”.

When Mirror is stale:

- Address/alias resolution can fail.
- Contract result / receipt retrieval can fail.

We attempted to mitigate receipt fetching by setting:

- `GET_RECORD_DEFAULT_TO_CONSENSUS_NODE=true` (relay config)

But:

- That only helps *some* receipt/record lookup paths.
- It does not solve the sender address resolution dependency on Mirror.

### 7.5 Concrete Commands Used to Prove Ingestion Was Stuck

Mirror importer repeating "no new sig files":

```bash
kubectl -n <ns> logs deploy/mirror-1-importer --tail=200 | grep -E \"No new signature files\"
```

Consensus node record streams showing only 10-byte `.rcd.gz` output:

```bash
kubectl -n <ns> exec network-node1-0 -c root-container -- sh -lc \
  'find /opt/hgcapp/recordStreams -maxdepth 3 -type f -printf \"%p %s\\n\" | sort | tail -n 50'
```

Events streams working (contrast signal):

```bash
kubectl -n <ns> exec network-node1-0 -c root-container -- sh -lc \
  'find /opt/hgcapp/eventsStreams -maxdepth 3 -type f -printf \"%p %s\\n\" | sort | tail -n 50'
```

## 8) What Must Be True for Two-Solo + JSON-RPC Relay to Work

To run the bridged two-ledger test reliably using JSON-RPC relay endpoints:

1. Two Solo networks must run concurrently in distinct namespaces.
2. Each network must expose a reachable JSON-RPC endpoint (usually `relay-1`).
3. Each relay must have a working Mirror URL.
4. Each Mirror must be healthy and **ingesting continuously**.
5. Record stream pipeline must be healthy end-to-end.
6. The signer ECDSA key used by the tests must correspond to an account that exists and is funded on both ledgers.

Record stream pipeline sub-requirements:

- Consensus node writes non-trivial `.rcd.gz` files.
- Consensus node writes matching `.rcd_sig` files.
- `record-stream-uploader` uploads both files to MinIO.
- Mirror importer downloads signature files and ingests into Postgres.
- Mirror REST returns the expected account/transaction data.

If any of these is false, the relay-based approach can fail even if:

- the consensus node itself is operating normally, and
- gRPC/HAPI queries can see state that Mirror cannot.

## 9) Why the Two-Ledger Scenario Is So Much Harder Than Single-Ledger Mocked Tests

Single-ledger “smoke” style testing (Hardhat in-process, or one Solo network) avoids most of this:

- One environment (not two).
- Often no dependency on Mirror ingestion for basic contract execution.
- Reason: in-process Hardhat does not use Mirror at all; direct HAPI-based execution can avoid Mirror depending on how you fetch receipts/results.

Two-ledger testing adds compounding requirements:

- Two consensus nodes.
- Two mirrors.
- Two relays.
- Two sets of account provisioning.
- A cross-ledger relayer process.
- More K8s surface area (resource pressure, port-forward coordination, ingress collisions).

And critically:

- JSON-RPC relay is not “just an RPC endpoint”; it is an integration point that depends on Mirror Node’s view of the world.

## 10) ODIN Implications (How This Informs an ODIN-Based Attempt)

If the goal is to make ODIN succeed even when JSON-RPC relay is flaky/unavailable:

- Prefer an execution mode that uses consensus node gRPC/HAPI (`EthereumTransaction` via SDK) for actions.
- Use gRPC queries for sensing.
- Example gRPC sensors: `AccountInfoQuery` (including alias resolution via `AccountId.fromEvmAddress`), `TransactionRecordQuery`, `TransactionReceiptQuery`.
- Treat Mirror as an optional sensor rather than a hard dependency, until record stream ingestion is proven stable.
- Add explicit health gates to ODIN runs:
- validate relay is up
- validate mirror ingestion is advancing (record stream signatures arriving)
- validate the signer account exists and is funded

If the goal is specifically to use JSON-RPC relay:

- Then ODIN needs to include Mirror ingestion health checks and either fail fast with diagnostics or automatically reset/re-provision.

## 11) Diagnostics to Capture Before “Destroy and Recreate”

When this fails again, capture these before resetting:

- `kubectl -n <ns> get pods -o wide`
- `kubectl -n <ns> logs deploy/mirror-1-importer --tail=200`
- `kubectl -n <ns> logs network-node1-0 -c record-stream-uploader --tail=200`
- `kubectl -n <ns> exec network-node1-0 -c root-container -- sh -lc 'find /opt/hgcapp/recordStreams -maxdepth 3 -type f -printf \"%p %s\\n\" | sort | tail -n 50'`
- `kubectl -n <ns> exec network-node1-0 -c root-container -- sh -lc 'cat /opt/hgcapp/services-hedera/HapiApp2.0/VERSION'`

The single most suspicious “smoking gun” we saw:

- record stream `.rcd.gz` files being created but only **10 bytes** and never producing a `.rcd_sig`.
