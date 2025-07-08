import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Handle Chrome DevTools requests
  if (pathname === '/.well-known/appspecific/com.chrome.devtools.json') {
    return new NextResponse(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Handle font requests that might be incorrectly routed
  if (pathname.startsWith('/fonts/') && pathname.endsWith('.woff2')) {
    // These fonts are loaded via next/font/google, not from public folder
    return new NextResponse(null, { status: 404 });
  }
  
  // Continue with normal request handling
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/.well-known/:path*',
    '/fonts/:path*',
  ],
};