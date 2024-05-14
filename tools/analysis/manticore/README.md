# Manticore
[Manticore](https://github.com/trailofbits/manticore) is a versatile symbolic execution tool that can analyze Ethereum Smart Contracts,
Linux binaries, and Windows binaries. It's widely used for security auditing and testing of
applications where security is paramount. Its main features include:
- **Program Exploration**: executing a program with symbolic inputs and exploring all the possible states it can reach,
- **Input Generation**: producing concrete inputs that result in a given program state,
- **Error Discovery**: detecting crashes and other failure cases in binaries and Smart Contracts,
- **Instrumentation**: providing fine-grained control of state exploration via event callbacks and instruction hooks,
- **Programmatic Interface**: exposing programmatic access to its analysis engine via a Python API.

Manticore can analyze the following types of programs:

- Ethereum Smart Contracts (EVM bytecode)
- Linux ELF binaries (x86, x86_64, aarch64, and ARMv7)
- WASM Modules

## Installation and execution:
- Usage example (version 3.5):
  - Install container orchestration software [docker compose](https://docs.docker.com/reference/cli/docker/compose/),
  - Execute the following commands:
    ```shell
    docker-compose up -d
    manticore examples/evm/umd_example.sol
    ```

> **Sidenotes**:
> - Installing by PIP results in [protobuf incorrect version error](https://github.com/trailofbits/manticore/issues/2600)
> - Build attempt with docker image version 3.7+ result in [attribute error](https://github.com/trailofbits/manticore/issues/2600)
> - Build attempt with docker image version 3.6 results in [tool custom exception](https://github.com/trailofbits/manticore/issues/2477)
> - Manticore may be built on docker image version 3.5.

> **Support**:
> This project is no longer internally developed and maintained. The team responsible for creating this tool announced its
> readiness to review and accept small, well-written pull requests by the community (only bug fixes and minor
> enhancements shall be considered). But there have veen no changes in the tool`s codebase since December 2022. All errors
> are already [reported](https://github.com/trailofbits/manticore/issues)

### Custom detector investigation
Manticore has no documented ways to introduce new detectors. It requires adding a new detector class to [detectors.py](https://github.com/trailofbits/manticore/blob/master/manticore/ethereum/detectors.py) file and importing it in cli.py (for command line interface analysis).
## Recommendations and possible investments in the tool:
* Issues encountered in the latest versions of the application should be resolved.
