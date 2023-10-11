# Source code documentation

## Codebase structure (folder tree)

    .
    ├── __tests__/
    │   ├──ethers/
    │   ├──hedera/
    │   │  ├── erc20-interactions/
    │   │  ├── erc721-interactions/
    │   │  ├── exchange-rate-interactions/
    │   │  ├── helper/
    │   │  ├── ihrc-interactions
    │   │  ├── prng-interactions
    │   │  └── hts-interactions/
    │   │      └── token-create-custom/
    │   │      └── token-management-contract/
    │   │      └── token-transfer-contract/
    │   │      └── token-query-contract/
    │   ├──mirror-node/
    │   │  └── erc20-interactions/
    │   └──utils/
    │      └── common/
    │
    ├── prerequisite-check/
    │   └──contracts-info/
    │   └──scripts/
    │
    ├── docs/
    │
    ├── public/
    │   ├── assets
    │   │   └── docs/
    │   │   └── icons/
    │   │   └── socials/
    │   └── brandings/
    │
    ├── src/
    │   ├── api/
    │   │   ├── cookies/
    │   │   ├── ethers/
    │   │   ├── localStorage/
    │   │   ├── mirror-node/
    │   │   ├── wallet/
    │   │   └─ hedera/
    │   │       ├── erc20-interactions/
    │   │       ├── erc721-interactions/
    │   │       ├── exchange-rate-interactions/
    │   │       ├── ihrc-interactions/
    │   │       ├── prng-interactions/
    │   │       └── hts-interactions/
    │   │           └── tokenCreateCustom-interactions/
    │   │           └── tokenManagement-interactions/
    │   │           └── tokenQuery-interactions/
    │   │           └── tokenTransfer-interactions/
    │   ├── app/
    │   │   ├── activity/
    │   │   └── hedera/
    │   │       └── erc-20/
    │   │       └── erc-721/
    │   │       └── exchange-rate-hip-475/
    │   │       └── hrc-719/
    │   │       └── hts-hip-206/
    │   │       └── overview/
    │   │       └── prng-hip-351/
    │   │
    │   ├── component/
    │   │   ├── background-gradients/
    │   │   ├── common/
    │   │   │   └── components/
    │   │   │   └── methods/
    │   │   ├── contract-interaction/
    │   │   │   ├── erc/
    │   │   │   │   ├── deployment/
    │   │   │   │   ├── erc-20/
    │   │   │   │   │   ├── methods/
    │   │   │   │   │   │   └── balance-of/
    │   │   │   │   │   │   └── mint/
    │   │   │   │   │   │   └── token-information/
    │   │   │   │   │   │   └── token-permission/
    │   │   │   │   │   │   └── token-transfer/
    │   │   │   │   └── erc-721/
    │   │   │   │       └── methods/
    │   │   │   │           └── approve/
    │   │   │   │           └── balance-of/
    │   │   │   │           └── mint/
    │   │   │   │           └── operator-approve/
    │   │   │   │           └── owner-of/
    │   │   │   │           └── token-information/
    │   │   │   │           └── token-transfer/
    │   │   │   │           └── token-uri/
    │   │   │   │
    │   │   │   ├── exchange-rate/
    │   │   │   │   ├── deployment/
    │   │   │   │   └── methods/
    │   │   │   │
    │   │   │   ├── hts/
    │   │   │   │   ├── shared/
    │   │   │   │   │   └── components/
    │   │   │   │   │   └── methods/
    │   │   │   │   │   └── states/
    │   │   │   │   │
    │   │   │   │   ├── token-create-custom/
    │   │   │   │   │   └── methods/
    │   │   │   │   │       └── AssociateHederaToken/
    │   │   │   │   │       └── FungibleTokenCreate/
    │   │   │   │   │       └── GrantTokenKYC/
    │   │   │   │   │       └── MintHederaToken/
    │   │   │   │   │       └── NonFungibleTokenCreate/
    │   │   │   │   │
    │   │   │   │   ├── token-management-contract/
    │   │   │   │   │   └── methods/
    │   │   │   │   │       └── manageTokenDelete/
    │   │   │   │   │       └── manageTokenInfo/
    │   │   │   │   │       └── manageTokenPermission/
    │   │   │   │   │       └── manageTokenRelation/
    │   │   │   │   │       └── manageTokenStatus/
    │   │   │   │   │       └── manageTokenSupplyReduction/
    │   │   │   │   │
    │   │   │   │   ├── token-query-contract/
    │   │   │   │   │   └── methods/
    │   │   │   │   │       └── querySpecificToken/
    │   │   │   │   │       └── queryTokenGeneralInfo/
    │   │   │   │   │       └── queryTokenPermission/
    │   │   │   │   │       └── queryTokenStatus/
    │   │   │   │   │       └── queryTokenValidity/
    │   │   │   │   │
    │   │   │   │   └── token-transfer-contract
    │   │   │   │       └── methods/
    │   │   │   │           └── transferCrypto/
    │   │   │   │           └── transferMultipleTokens/
    │   │   │   │           └── transferSingleToken/
    │   │   │   │
    │   │   │   ├── ihrc/
    │   │   │   │   └── methods/
    │   │   │   │
    │   │   │   └── prng/
    │   │   │       └── methods/
    │   │   │
    │   │   ├── footer/
    │   │   │
    │   │   ├── navbar/
    │   │   │
    │   │   ├── sidebar/
    │   │   │
    │   │   └── toast/
    │   │
    │   ├── fonts/
    │   │
    │   ├── hooks/
    │   │
    │   ├── libs/
    │   │   ├── chakra/
    │   │   └── framer-motion/
    │   │
    │   ├── sections/
    │   │   ├── activity/
    │   │   ├── erc-20/
    │   │   ├── erc-721/
    │   │   ├── exchange-rate-hip-475/
    │   │   ├── hrc-719/
    │   │   ├── hts-hip-206/
    │   │   ├── landing/
    │   │   ├── overview/
    │   │   └── prng-hip-351/
    │   │
    │   ├── styles/
    │   │
    │   ├── types/
    │   │   ├── common/
    │   │   └── contract-interactions/
    │   │       ├── erc/
    │   │       ├── HTS/
    │   │       └── shared/
    │   │
    │   ├── utils/
    │   │   ├── common/
    │   │   └── contract-interactions/
    │   │       ├── erc/
    │   │       └── HTS/
    │   └── middleware.ts
    │
    │
    ├── .eslintrc.json
    ├── .gitignore
    ├── .prettierrc
    ├── jest.config.mjs
    ├── Makefile
    ├── next-env.d.ts
    ├── next.config.js
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.js
    ├── README.md
    ├── tailwind.config.js
    └── tsconfig
