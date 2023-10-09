# Source Code Documentation

## Codebase Walkthrough - **src/middleware.tsx** File

### Overview

The **middleware.tsx** file functions as a module providing middleware capabilities for request handling within a Next.js application. Its primary responsibility lies in processing incoming requests and making routing decisions based on specific request properties.

This middleware also plays a crucial role in ensuring that access to protected routes is only granted after users have connected their wallet to the DApp.

### Adding New System Contracts to the DApp

Within the `middleware.ts` file, you will encounter the `isProtectedRoute()` function. This function is employed to assess the `pathname` variable, determining whether it corresponds to a protected route. It accomplishes this by checking if the `pathname` is included in the `PROTECTED_ROUTES` constant variable, which can be found in the [constants.ts](../../../../../../src/utils/common/constants.ts) file.

Introducing a new system contract to the DApp involves adding a dedicated route within the `src/app/hedera/` folder to showcase the contract. This new route is essentially designated as a protected route. To achieve this, simply include the new route in the `PROTECTED_ROUTES` array within the `constants.ts` file. For instance, if you're adding the `ERC1155Mock` contract with a new route, such as `/hedera/erc-1155/`, the updated `PROTECTED_ROUTES` array would look as follows:

```typescript
export const PROTECTED_ROUTES = [
  '/hedera/overview',
  '/hedera/hts-hip-206',
  '/hedera/hrc-719',
  '/hedera/exchange-rate-hip-475',
  '/hedera/prng-hip-351',
  '/hedera/erc-20',
  '/hedera/erc-721',
  '/hedera/erc-1155/', // New addition here
  '/activity',
];
```

This modification ensures that the new route corresponding to the `ERC1155Mock` contract is appropriately categorized as a protected route, aligning with the DApp's security and access control requirements.
