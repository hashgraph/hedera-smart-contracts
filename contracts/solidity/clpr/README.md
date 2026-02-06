# CLPR Solidity (IT0)

This folder contains the first incremental smart-contract reference implementation for CLPR middleware (`IT0-ECHO`).

## Goal

`IT0-ECHO` validates the minimum end-to-end middleware flow:

1. Source application sends through source middleware.
2. Source middleware enqueues request to a queue abstraction.
3. Queue delivers request to destination middleware.
4. Destination middleware calls destination application.
5. Destination middleware enqueues response to queue.
6. Queue delivers response to source middleware.
7. Source middleware delivers response to source application.

This iteration intentionally excludes connector logic, economics, and proof concerns.

## Layout

- `types/`
  - Shared CLPR message envelopes.
- `interfaces/`
  - External API surfaces for middleware, queue, and applications.
- `middleware/`
  - IT0 middleware implementation.
- `mocks/`
  - In-memory queue mock for deterministic local tests.
- `apps/`
  - Reference source and echo applications used for validation.

## Notes for later iterations

- Connector interfaces and implementations should be introduced separately from middleware internals.
- Public interfaces in `interfaces/` should remain the stable integration surface for third-party developers.
- Internal middleware implementation details should evolve without breaking established public APIs.
- Explicit middleware addresses in IT0 envelopes are a temporary simplification until connection abstractions are added.
- `ClprMessageResponse.success` should evolve from a boolean to a richer status model (e.g., enum/code taxonomy).
