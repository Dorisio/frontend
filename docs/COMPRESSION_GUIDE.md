# Request/Response Compression Guide

This document outlines the compression and minification setup for the Dorisio frontend application to optimize network performance and reduce bandwidth usage.

## Overview

Our compression strategy includes:
- **Gzip compression** for text-based responses
- **Asset optimization** for images, fonts, and static files  
- **API response compression** for JSON payloads
- **Build-time minification** for JavaScript and CSS
- **Performance monitoring** to track compression effectiveness

## Compression Strategy

### 1. Static Assets
- **JavaScript/CSS**: Gzipped + minified at build time
- **Images**: WebP/AVIF format conversion
- **Fonts**: Woff2 format with optimal compression
- **SVGs**: Minified and gzipped

### 2. Dynamic Content
- **API responses**: Gzip compression for JSON
- **HTML pages**: Server-side compression
- **Real-time data**: Selective compression based on size

### 3. CDN Integration
- **Edge compression**: Additional compression at CDN level
- **Cache optimization**: Compressed assets cached longer
- **Geographic distribution**: Reduced latency worldwide

## Implementation

### Next.js Configuration (`next.config.js`)
```javascript
const nextConfig = {
  compress: true,  // Enable built-in compression
  
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000,
  },
  
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Content-Encoding',
            value: 'gzip',
          },
          {
            key: 'Cache-Control', 
            value: 'public, max-age=300, s-maxage=600',
          },
        ],
      },
    ];
  },
};
```

### Middleware Compression (`src/middleware.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  const supportsGzip = acceptEncoding.includes('gzip');
  
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (supportsGzip) {
      response.headers.set('Content-Encoding', 'gzip');
    }
    response.headers.set('Cache-Control', 'public, max-age=300');
  }
  
  return response;
}
```

### Build-time Optimization
```json
{
  "scripts": {
    "build": "next build",
    "analyze": "ANALYZE=true pnpm build"
  }
}
```

## Compression Types and Ratios

### Text Content Compression
| Content Type | Original Size | Compressed Size | Ratio |
|--------------|---------------|-----------------|-------|
| HTML         | 100KB        | 25KB           | 75%   |
| CSS          | 200KB        | 40KB           | 80%   |
| JavaScript   | 500KB        | 125KB          | 75%   |
| JSON API     | 50KB         | 12KB           | 76%   |

### Image Optimization
| Format | Original | WebP | AVIF | Savings |
|--------|----------|------|------|---------|
| PNG    | 500KB   | 200KB| 150KB| 70%     |
| JPEG   | 300KB   | 180KB| 140KB| 53%     |
| SVG    | 50KB    | 15KB | N/A  | 70%     |

## Performance Monitoring

### Key Metrics
```typescript
// Compression monitoring utility
export function trackCompressionMetrics(
  originalSize: number, 
  compressedSize: number, 
  contentType: string
) {
  const ratio = ((originalSize - compressedSize) / originalSize) * 100;
  
  // Send to analytics
  analytics.track('compression_applied', {
    content_type: contentType,
    original_size: originalSize,
    compressed_size: compressedSize,
    compression_ratio: ratio,
    timestamp: Date.now()
  });
}
```

### Real-time Monitoring
```typescript
// Middleware for performance tracking
export function compressionMiddleware(request: NextRequest) {
  const startTime = Date.now();
  
  return NextResponse.next().then(response => {
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    response.headers.set('X-Response-Time', processingTime.toString());
    response.headers.set('X-Compression-Applied', 'true');
    
    return response;
  });
}
```

## Content-Specific Optimization

### 1. API Responses
```typescript
// Compress large JSON responses
export async function compressApiResponse(data: any): Promise<Response> {
  const jsonString = JSON.stringify(data);
  const size = new Blob([jsonString]).size;
  
  // Only compress responses larger than 1KB
  if (size > 1024) {
    return new Response(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
        'Cache-Control': 'public, max-age=300'
      }
    });
  }
  
  return new Response(jsonString, {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 2. Image Optimization
```typescript
// next.config.js image optimization
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};
```

### 3. Font Optimization
```css
/* Optimized font loading */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
```

## Testing and Validation

### Compression Testing
```bash
# Test gzip compression
curl -H "Accept-Encoding: gzip" -v https://your-domain.com/api/data

# Analyze bundle size
pnpm analyze

# Test image optimization  
lighthouse https://your-domain.com --only-categories=performance
```

### Automated Testing
```typescript
// e2e/compression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Compression Tests', () => {
  test('API responses are compressed', async ({ page }) => {
    const response = await page.request.get('/api/users', {
      headers: { 'Accept-Encoding': 'gzip' }
    });
    
    expect(response.headers()['content-encoding']).toBe('gzip');
  });
  
  test('Static assets are compressed', async ({ page }) => {
    const response = await page.request.get('/_next/static/chunks/main.js');
    
    expect(response.headers()['content-encoding']).toBe('gzip');
    expect(response.headers()['cache-control']).toContain('immutable');
  });
  
  test('Images are optimized', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src?.includes('/_next/image')) {
        expect(src).toMatch(/w=\d+/); // Width parameter present
        expect(src).toMatch(/q=\d+/); // Quality parameter present
      }
    }
  });
});
```

### Performance Benchmarks
```typescript
// Performance monitoring
export class CompressionBenchmark {
  async measureCompressionRatio(url: string): Promise<number> {
    const [compressed, uncompressed] = await Promise.all([
      this.fetchWithCompression(url),
      this.fetchWithoutCompression(url)
    ]);
    
    return ((uncompressed.size - compressed.size) / uncompressed.size) * 100;
  }
  
  private async fetchWithCompression(url: string) {
    const response = await fetch(url, {
      headers: { 'Accept-Encoding': 'gzip' }
    });
    
    return {
      size: parseInt(response.headers.get('content-length') || '0'),
      data: await response.text()
    };
  }
}
```

## Troubleshooting

### Common Issues

1. **Double Compression**
   ```typescript
   // Problem: Compressing already compressed content
   if (contentEncoding.includes('gzip')) {
     return response; // Don't compress again
   }
   ```

2. **Ineffective Compression on Small Files**
   ```typescript
   // Solution: Size threshold
   const COMPRESSION_THRESHOLD = 1024; // 1KB
   
   if (contentLength < COMPRESSION_THRESHOLD) {
     return response; // Skip compression
   }
   ```

3. **Browser Compatibility**
   ```typescript
   // Check client support
   const acceptEncoding = request.headers.get('accept-encoding') || '';
   const supportsBrotli = acceptEncoding.includes('br');
   const supportsGzip = acceptEncoding.includes('gzip');
   ```

### Performance Debugging
```bash
# Analyze compression effectiveness
npx webpack-bundle-analyzer .next/static/chunks/*.js

# Test real-world performance
curl -w "@curl-format.txt" -H "Accept-Encoding: gzip" -s -o /dev/null https://your-domain.com/api/data

# Monitor compression ratios
grep "content-encoding" access.log | awk '{print $1}' | sort | uniq -c
```

## Best Practices

### 1. Content Selection
- ✅ Compress text content (HTML, CSS, JS, JSON, SVG)
- ❌ Don't compress already compressed formats (images, videos, archives)
- ✅ Use appropriate quality settings for images
- ✅ Implement progressive image loading

### 2. Caching Strategy
```typescript
const cacheHeaders = {
  // Static assets - long cache
  '/_next/static/': 'public, max-age=31536000, immutable',
  
  // API responses - short cache  
  '/api/': 'public, max-age=300, s-maxage=600',
  
  // Images - medium cache
  '/images/': 'public, max-age=86400',
};
```

### 3. Monitoring and Alerts
```typescript
// Set up alerts for compression ratio drops
const compressionAlert = {
  threshold: 0.6, // Alert if compression ratio drops below 60%
  channels: ['#performance-alerts'],
  metrics: ['api_compression_ratio', 'asset_compression_ratio']
};
```

## Resources

### Tools
- [webpack-bundle-analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [GTmetrix](https://gtmetrix.com/)
- [WebPageTest](https://www.webpagetest.org/)

### Documentation
- [Next.js Compression](https://nextjs.org/docs/api-reference/next.config.js/compression)
- [Web Performance Optimization](https://web.dev/performance/)
- [Image Optimization Guide](https://web.dev/serve-images-webp/)

### Monitoring Services
- [New Relic](https://newrelic.com/)
- [DataDog](https://www.datadoghq.com/)
- [Pingdom](https://www.pingdom.com/)
- [GTmetrix Monitoring](https://gtmetrix.com/monitoring/)