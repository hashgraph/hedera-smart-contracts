# Source Code Documentation

## Codebase Walkthrough - **src/app/** Folder

### a. Overview

The **src/app/** folder is a pivotal addition introduced in Next.js 13, offering enhanced flexibility in configuring the UI through loading, error handling, and layout components. This directory serves as the cornerstone for route management and view rendering in a Next.js application. With the advent of Next.js 13, the `app/` folder brings about new conventions and practices that simplify the creation of pages, shared layouts, and templates. You can find more information about these conventions [here](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts).

### b. Folder Structure

- `page.tsx` file: This file serves as the primary or root UI component for the entire project.

- `layout.tsx` file: This file represents the root shared layout for the entire project. It plays a crucial role in preserving state, maintaining interactivity, and avoiding unnecessary re-renders when navigating between multiple pages.

- `activity/` folder: This folder corresponds to the `/activity` route. It follows a similar structure with a `page.tsx` file, representing the main UI component for the `/activity` route, and a `layout.tsx` file, serving as the shared layout specific to the `/activity` route.

- `hedera/` folder: This folder represents the `/hedera` route. It does not include a `page.tsx` file, which means it won't be found when navigating to the `/hedera` route. Instead, it comprises a group of subdirectories, each dedicated to a specific smart contract exposed in the DApp. Again, each subdirectory contains its own `page.tsx` file, representing the main UI component for its respective route.

### b. Adding New System Contracts to the DApp

#### b1. Folder Structure

Maintaining a well-structured folder organization is paramount. Each subdirectory within this folder should be designated for a specific contract or contract category. Consequently, introducing a new contract necessitates the creation of a dedicated folder to accommodate it.

#### b2. `page.tsx` File Structure

It's worth noting that all the `page.tsx` files located in these subdirectories share a common structure. They typically contain an imported component that serves as the main content for the route. For instance:

```typescript
import HTS206Section from '@/sections/hts-hip-206';

const HTS206 = () => {
  return <HTS206Section />;
};

export default HTS206;
```

The imported components are section-level components defined in the `src/sections/` directory. This design allows for server-side rendering or data fetching when needed, as the root `page.tsx` can be used for such purposes, while the client-side logic remains within the section-level components.

Consequently, when creating a new route for a new contract, it is recommended to adhere to this established code layout for consistency and maintainability.
