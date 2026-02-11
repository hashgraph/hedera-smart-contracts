# CLPR Solidity

This folder contains the current incremental smart-contract reference implementation for CLPR middleware
(currently aligned to the spec's `IT1-CONN-AUTH` behavior, plus MVP connector economics scaffolding).

## Goal

This increment validates:

1. The minimum end-to-end middleware flow (request -> response).
2. Wiring of the source connector authorization hook (`authorize`) before enqueue.
3. Message envelope shapes aligned to the current CLPR spec (draft/message/response), including:
   - message id assigned by the messaging layer (out-of-band), and
   - per-application middleware-assigned ids (`ClprAppMsgId`) returned to apps via `ClprSendMessageStatus`.
4. Connector registration + pairing (1:1 association between local connector id and expected remote connector id).
5. Destination-side connector funds checks using balance report + safety threshold semantics.
6. Remote connector status propagation back to the source middleware via balance reports, enabling pre-enqueue
   rejections when the latest-known remote state is out-of-funds.
7. Connector preference + failover behavior demonstrated in the reference `SourceApplication`.

Flow (single-ledger simulation with an in-memory messaging mock):

0. Connectors register with middleware (prototype self-registration).
   - In the spec this is performed by protocol transactions rather than direct contract calls.
   - Applications register with middleware so it can route/deliver callbacks.
1. Source application sends through source middleware.
2. Source middleware constructs `ClprMessageDraft` and calls the source connector `authorize`.
3. Source middleware enqueues `ClprMessage` to the queue (mock messaging layer assigns `ClprMsgId`).
4. Queue delivers `ClprMessage` + `ClprMsgId` to destination middleware.
5. Destination middleware calls destination application (`handleMessage`) and constructs `ClprMessageResponse`.
   - If destination connector is underfunded (below safety threshold capacity), the destination application is
     not executed and the response is marked `ConnectorOutOfFunds`.
6. Queue enqueues `ClprMessageResponse` and later delivers it to source middleware.
   - In the IT1 mock queue this delivery is an explicit step (`deliverMessageResponse` / `deliverAllMessageResponses`)
     to simulate the async boundary between send and response.
7. Source middleware delivers `ClprApplicationResponse` to source application (`handleResponse`) along with the original `ClprAppMsgId`.

This iteration still excludes proof concerns and uses an in-memory mock queue instead of the real messaging layer.

## Layout

- `types/`
  - Shared CLPR message envelopes and value types.
- `interfaces/`
  - External API surfaces for middleware, messaging, connectors, and applications.
- `middleware/`
  - Current middleware implementation.
- `mocks/`
  - In-memory messaging and connector mocks for deterministic local tests.
  - Includes `MockClprRelayedQueue` for two-network testing with an off-chain relayer.
- `apps/`
  - Reference source and echo applications used for validation.

## Notes for later iterations

- Public interfaces in `interfaces/` are intended to become the stable integration surface for third-party developers.
  In this repo, CLPR is still a prototype and interfaces may evolve as the spec is refined.
- Connector registration/pairing and economic enforcement are modeled here with simplified mechanics.
  Later iterations should replace these mechanics with protocol-level operations and add proofs.

## Two-network testing

Before the real messaging layer is integrated, `MockClprRelayedQueue` can be used to run CLPR flows across
two separate Solo deployments with an off-chain relayer loop.

See: `test/network/clpr/README.md`.
