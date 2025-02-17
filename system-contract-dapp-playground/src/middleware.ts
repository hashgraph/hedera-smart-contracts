// SPDX-License-Identifier: Apache-2.0

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isProtectedRoute } from './utils/common/helpers';

export async function middleware(request: NextRequest) {
  const isConnected = request.cookies.get('_isConnected')?.value;
  const { pathname } = request.nextUrl;

  if (isConnected && pathname === '/') {
    return NextResponse.redirect(new URL(`/hedera/overview`, request.url));
  }

  if (!isConnected && isProtectedRoute(pathname)) {
    return NextResponse.redirect(new URL(`/`, request.url));
  }
}

export const config = {
  matcher: ['/', '/hedera/:path*', '/activity'],
};
