# Source code documentation

## Overview

The `System Contract DApp Playground` project, often referred to as the DApp or DApp Playground, has been developed using a stack comprising the `React library`, `Next.js framework`, `Tailwind CSS`, and the `Chakra UI component library`. The primary objective behind this project is to provide developers with a seamless and user-friendly platform for interacting with Hedera's system contracts. The project's core purpose is to simplify the process, minimize complexities, shorten learning curves, and ultimately save valuable time for developers.

## Purpose

This document is intended to offer a thorough and elucidating account of the code components encompassed within the DApp, facilitating a deeper understanding of its inner workings.

## Goals

Offers a concise and accessible overview of the code components as well as provides a clear understanding of the codebase. This serves as a valuable resource for individuals interested in contributing to the project, enabling them to quickly grasp its structure and functionalities.

### Table of contents

##### Codebase Structure

- [Folder tree](./codebase-structure/1.folder-tree/index.md)

- Codebase Walkthrough

  - [\_\_tests\_\_/](./codebase-structure/2.codebase-walkthrough/__tests__/index.md)
  - [prerequisite-check/](./codebase-structure/2.codebase-walkthrough/prerequisite-check/index.md)
  - [public/](./codebase-structure/2.codebase-walkthrough/public/index.md)
  - src/

    - [api/](./codebase-structure/2.codebase-walkthrough/src/api/index.md)
    - [app/](./codebase-structure/2.codebase-walkthrough/src/app/index.md)
    - components/

      - [activity/](./codebase-structure/2.codebase-walkthrough/src/components/activity/index.md)
      - [background-gradients/](./codebase-structure/2.codebase-walkthrough/src/components/background-gradients/index.md)
      - [common/](./codebase-structure/2.codebase-walkthrough/src/components/common/index.md)
      - [contract-interactions/](./codebase-structure/2.codebase-walkthrough/src/components/contract-interactions/index.md)
      - [footer/](./codebase-structure/2.codebase-walkthrough/src/components/footer/index.md)
      - [navbar/](./codebase-structure/2.codebase-walkthrough/src/components/navbar/index.md)
      - [sidebar/](./codebase-structure/2.codebase-walkthrough/src/components/sidebar/index.md)
      - [toast/](./codebase-structure/2.codebase-walkthrough/src/components/toast/index.md)
      - [wallet-popup/](./codebase-structure/2.codebase-walkthrough/src/components/wallet-popup/index.md)

    - [fonts/](./codebase-structure/2.codebase-walkthrough/src/fonts/index.md)
    - [hooks/](./codebase-structure/2.codebase-walkthrough/src/hooks/index.md)
    - [libs/](./codebase-structure/2.codebase-walkthrough/src/libs/index.md)
    - [sections/](./codebase-structure/2.codebase-walkthrough/src/sections/index.md)
    - [styles/](./codebase-structure/2.codebase-walkthrough/src/styles/index.md)
    - [types/](./codebase-structure/2.codebase-walkthrough/src/types/index.md)
    - [utils/](./codebase-structure/2.codebase-walkthrough/src/utils/index.md)
    - [middleware.ts/](./codebase-structure/2.codebase-walkthrough/src/middleware.md)

  - [config-files](./codebase-structure/2.codebase-walkthrough/config-files/index.md)

#### Tutorials on How to Add a New System Contract to the DApp

Here is a step-by-step guide for adding a new contract to the DApp:

1. **Prerequisite Check**

   Begin by ensuring that the contract assets are available in the `prerequisite-check` directory. Follow the tutorial [here](./codebase-structure/2.codebase-walkthrough/prerequisite-check/index.md#b-adding-new-system-contracts-to-the-dapp) for detailed instructions.

2. **New Dedicated Route**

   Create a dedicated route for the new system contract. Learn how to do this by following the guide [here](./codebase-structure/2.codebase-walkthrough/src/app/index.md#b-adding-new-system-contracts-to-the-dapp).

3. **Add the Dedicated Route to `PROTECTED_ROUTES`**

   As the new route is considered a protected route, you need to add it to the `PROTECTED_ROUTES` constant variable. Find out how to do this [here](./codebase-structure/2.codebase-walkthrough/src/middleware.md#adding-new-system-contracts-to-the-dapp).

4. **Contract Section UI Component**

   Create a client-side section-level UI component to showcase the new contract. Follow the instructions provided [here](./codebase-structure/2.codebase-walkthrough/src/sections/index.md#b-adding-new-system-contracts-to-the-dapp).

5. **Method APIs**

   Implement the method APIs for the new system contract. Learn how to add these APIs [here](./codebase-structure/2.codebase-walkthrough/src/api/index.md#b-adding-new-system-contracts-to-the-dapp).

6. **Contract-Interaction UI Component**

   Design the contract-interaction UI component that allows users to interact with the smart contract. Note that this component's layout may vary depending on the specific method APIs. Detailed instructions can be found [here](./codebase-structure/2.codebase-walkthrough/src/components/contract-interactions/index.md#b-adding-new-system-contracts-to-the-dapp).
