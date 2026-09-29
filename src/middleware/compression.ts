import { NextRequest, NextResponse } from 'next/server';

export function compressionMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Check if the client supports gzip compression
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  const supportsGzip = acceptEncoding.includes('gzip');
  
  // Add compression headers for API routes and static assets
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (supportsGzip) {
      response.headers.set('Content-Encoding', 'gzip');
    }
    
    // Add cache control for API responses
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    
    // Add compression ratio header for monitoring
    response.headers.set('X-Compression-Enabled', supportsGzip ? 'true' : 'false');
  }
  
  // Handle static assets
  if (request.nextUrl.pathname.match(/\.(js|css|json)$/)) {
    if (supportsGzip) {
      response.headers.set('Content-Encoding', 'gzip');
    }
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