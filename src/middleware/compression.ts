import { NextRequest, NextResponse } from 'next/server';

export function compressionMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Note: this middleware does not itself compress response bodies - actual
  // gzip encoding is handled upstream (Next's `compress: true` in production,
  // or a reverse proxy/CDN in front of it). It must never set
  // `Content-Encoding: gzip` itself, since doing so without actually
  // gzip-encoding the body lies to the client about the wire format and
  // causes every browser to fail decoding the response
  // (net::ERR_CONTENT_DECODING_FAILED) - this previously broke the app
  // entirely in `next dev`, where nothing actually compresses the body.
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  const supportsGzip = acceptEncoding.includes('gzip');

  // Add compression headers for API routes and static assets
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Add cache control for API responses
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600');

    // Add compression ratio header for monitoring
    response.headers.set('X-Compression-Enabled', supportsGzip ? 'true' : 'false');
  }

  // Handle static assets
  if (request.nextUrl.pathname.match(/\.(js|css|json)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Add performance monitoring headers
  response.headers.set('X-Response-Time', Date.now().toString());

  return response;
}

export function getCompressionRatio(originalSize: number, compressedSize: number): number {
  return ((originalSize - compressedSize) / originalSize) * 100;
}

export function shouldCompress(contentType: string, size: number): boolean {
  // Don't compress already compressed formats
  const compressedTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'video/',
    'audio/',
    'application/zip',
    'application/gzip'
  ];
  
  if (compressedTypes.some(type => contentType.includes(type))) {
    return false;
  }
  
  // Only compress files larger than 1KB
  return size > 1024;
}