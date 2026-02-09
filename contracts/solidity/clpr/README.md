# CLPR Solidity

This folder contains the current incremental smart-contract reference implementation for CLPR middleware
(currently aligned to the spec's `IT1-CONN-AUTH` behavior).

## Goal

`IT1-CONN-AUTH` validates:

1. The minimum end-to-end middleware flow (request -> response).
2. Wiring of the source connector authorization hook (`authorize`) before enqueue.
3. Message envelope shapes aligned to the current CLPR spec (draft/message/response), including:
   - message id assigned by the messaging layer (out-of-band), and
   - per-application middleware-assigned ids (`ClprAppMsgId`) returned to apps via `ClprSendMessageStatus`.

Flow (single-ledger simulation with an in-memory messaging mock):

1. Source application sends through source middleware.
2. Source middleware constructs `ClprMessageDraft` and calls the source connector `authorize`.
3. Source middleware enqueues `ClprMessage` to the queue (mock messaging layer assigns `ClprMsgId`).
4. Queue delivers `ClprMessage` + `ClprMsgId` to destination middleware.
5. Destination middleware calls destination application (`handleMessage`) and constructs `ClprMessageResponse`.
6. Queue enqueues `ClprMessageResponse` and later delivers it to source middleware.
   - In the IT1 mock queue this delivery is an explicit step (`deliverMessageResponse` / `deliverAllMessageResponses`)
     to simulate the async boundary between send and response.
7. Source middleware delivers `ClprApplicationResponse` to source application (`handleResponse`) along with the original `ClprAppMsgId`.

This iteration intentionally excludes connector economics, connector registration, and proof concerns.

## Layout

- `types/`
  - Shared CLPR message envelopes and value types.
- `interfaces/`
  - External API surfaces for middleware, messaging, connectors, and applications.
- `middleware/`
  - Current middleware implementation.
- `mocks/`
  - In-memory messaging and connector mocks for deterministic local tests.
- `apps/`
  - Reference source and echo applications used for validation.

## Notes for later iterations

- Public interfaces in `interfaces/` should remain the stable integration surface for third-party developers.
- Internal middleware implementation details should evolve without breaking established public APIs.
- Connector registration/pairing and economic enforcement are deferred to the MVP iterations described in the spec.
