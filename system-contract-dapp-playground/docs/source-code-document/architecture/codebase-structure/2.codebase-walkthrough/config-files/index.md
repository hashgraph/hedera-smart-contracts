# Source code documentation

## Codebase Walkthrough - **config** files

| Config files                             | Purpose                                                                                                                                                                                                                                     |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [.eslintrc.json](.eslintrc.json)         | provides ESLint with the necessary configuration to enforce coding styles and best practices, specifically for a Next.js project with a focus on core web vitals.                                                                           |
| [.prettierrc](.prettierrc)               | allows to customize the formatting rules to match the preferred coding style.                                                                                                                                                               |
| [jest.config.mjs](jest.config.mjs)       | allows to customize the behavior of Jest for the dapp, such as specifying test environments, configuring module resolution, and setting up code transformers.                                                                               |
| [Makefile](Makefile)                     | a text file that contains a set of rules and instructions for the make utility, which is a tool used to manage and maintain computer programs.                                                                                              |
| [next-env.d.ts](next-env.d.ts)           | a declaration file that allows to extend the global TypeScript types and declare custom types specific to Next.js project. This file ensures that TypeScript correctly recognizes Next.js-specific types and prevents type-checking errors. |
| [next.config.js](next.config.js)         | allows to customize the Next.js configuration, including settings for features, plugins, environment variables, and webpack behavior.                                                                                                       |
| [postcss.config.js](postcss.config.js)   | specifies the PostCSS plugins and their settings used to process and transform CSS code during the build process.                                                                                                                           |
| [tailwind.config.js](tailwind.config.js) | allows to customize Tailwind CSS by providing options to modify colors, fonts, breakpoints, variants, and more, tailoring the framework to specific project requirements.                                                                   |
| [tsconfig.json](tsconfig.json)           | configures the TypeScript compiler settings, enabling to specify target environments, module systems, and other options, ensuring type-checking and compilation of TypeScript code for the project.                                         |