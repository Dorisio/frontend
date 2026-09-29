import { NextRequest } from 'next/server';
import { compressionMiddleware } from './middleware/compression';

export function middleware(request: NextRequest) {
  // Apply compression middleware
  return compressionMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};