/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isProtectedRoute = (pathname: string) => {
  const protectedRoutes = [
    '/overview',
    '/hts-hip-206',
    '/hrc-hip-719',
    '/exchange-rate-hip-206',
    '/prng-hip-351',
    '/erc-20',
    '/erc-721',
  ];

  return protectedRoutes.includes(pathname);
};

export async function middleware(request: NextRequest) {
  const isConnected = request.cookies.get('_isConnected')?.value;
  const { pathname } = request.nextUrl;

  if (isConnected && pathname === '/') {
    return NextResponse.redirect(new URL(`/overview`, request.url));
  }

  if (!isConnected && isProtectedRoute(pathname)) {
    return NextResponse.redirect(new URL(`/`, request.url));
  }
}

export const config = {
  matcher: [
    '/',
    '/overview',
    '/hts-hip-206',
    '/hrc-hip-719',
    '/exchange-rate-hip-206',
    '/prng-hip-351',
    '/erc-20',
    '/erc-721',
  ],
};
