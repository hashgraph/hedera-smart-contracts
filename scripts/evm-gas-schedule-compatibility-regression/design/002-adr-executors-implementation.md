---
status: "proposed"
date: "2025-05-06"
decision-makers: Fernano Paris <fernando.paris@swirldslabs.com>, Mariusz Jasuwienas <mariusz.jasuwienas@arianelabs.com>, Michal Walczak <michal.walczak@arianelabs.com>, Piotr Swierzy <piotr.swierzy@arianelabs.com>
consulted:
informed:
---

# ADR 002: Executor Integration Strategy – Microservices vs. Monolith

## Context and Problem Statement

We must decide whether executors should be implemented as standalone microservices communicating via one of several interfaces (HTTP, Redis queue, CLI), or remain as internal components within the monolithic JavaScript application.

This decision affects deployment complexity, test performance, extensibility, and maintainability.

## Considered Options

1. **Microservices with HTTP Interface**  
   Executors are deployed as standalone HTTP services. The Test Runner sends requests over HTTP to initiate and retrieve results.

2. **Microservices with Redis Queue**  
   Executors subscribe to a Redis queue and listen for job messages. The Test Runner pushes tasks to the queue and awaits responses asynchronously.

3. **Microservices with CLI Interface**  
   Executors are invoked via shell commands with parameters passed in, returning structured output. This allows language-agnostic implementation but introduces OS-level dependencies.

4. **Integrated Monolith Component** (Chosen)  
   Executors remain internal to the same JavaScript process as the Test Runner. They expose an internal API and share memory and configuration context.

## Decision Drivers

- **Simplicity and developer velocity**: Reducing cross-process communication and deployment overhead.
- **Consistency of tooling and language**: All components are currently JavaScript-based.
- **Future extensibility**: The option to break out into microservices remains open if requirements evolve.
- **Avoiding premature abstraction**: Focusing on near-term development efficiency while maintaining architectural flexibility.

## Decision Outcome

We choose to implement executors as components of the monolithic application, rather than separate microservices. This approach offers several immediate benefits:

1. **Simpler integration and deployment**  
   There is no need for network configuration, containerization, or process orchestration at this stage.

2. **Unified technology stack**  
   Since all components are being developed in JavaScript, there is no technical limitation in keeping everything in-process. Executor functions can be called directly, reducing overhead and improving performance.

3. **Future extensibility**  
   If the need arises to separate executors later, we can add new executor client that communicates with remote services using HTTP, CLI, or queues. Nothing in the current implementation prevents this transition.

## Consequences

- Positive: Faster development, fewer moving parts.
- Positive: Easier debugging and test orchestration in local and CI environments.
- Negative: Executors are more tightly coupled to the application, making scaling and language separation harder (though not impossible later).
- Trade-off: This decision is based on current needs and may be revisited if architectural pressures change.