/**
 * ComplianceIQ - Sovereign Regulatory URL & PDF Reachability Verification Utility
 * 
 * Standalone CLI Script & Automated Audit Daemon
 * Usage: npx tsx scripts/check_regulatory_links.ts
 */

import http from 'http';
import https from 'https';
import { MENAT_REGULATIONS } from '../src/data/menatData.ts';

interface LinkCheckResult {
  regulationId: string;
  regulationCode: string;
  authority: string;
  country: string;
  url: string;
  isPdf: boolean;
  status: number;
  statusText: string;
  responseTimeMs: number;
  isReachable: boolean;
  isBroken: boolean;
  redirectUrl?: string;
  error?: string;
}

async function verifyUrl(targetUrl: string, maxRedirects = 4): Promise<{
  status: number;
  statusText: string;
  responseTimeMs: number;
  isReachable: boolean;
  isBroken: boolean;
  redirectUrl?: string;
  error?: string;
}> {
  const startTime = Date.now();
  let currentUrl = targetUrl;
  let redirectsCount = 0;
  let lastRedirectUrl: string | undefined = undefined;

  try {
    while (redirectsCount <= maxRedirects) {
      const parsed = new URL(currentUrl);
      const isHttps = parsed.protocol === 'https:';
      const client = isHttps ? https : http;

      const res = await new Promise<{
        statusCode: number;
        headers: Record<string, string | string[] | undefined>;
      }>((resolve, reject) => {
        const req = client.request(
          {
            protocol: parsed.protocol,
            hostname: parsed.hostname,
            port: parsed.port || (isHttps ? 443 : 80),
            path: (parsed.pathname || '/') + (parsed.search || ''),
            method: 'GET',
            timeout: 2500,
            rejectUnauthorized: false,
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml,application/pdf;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          },
          (response) => {
            response.resume();
            resolve({
              statusCode: response.statusCode || 0,
              headers: response.headers as any,
            });
          }
        );

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Connection timed out (5000ms)'));
        });

        req.on('error', (err) => {
          reject(err);
        });

        req.end();
      });

      // Handle redirect
      if (
        (res.statusCode === 301 ||
          res.statusCode === 302 ||
          res.statusCode === 303 ||
          res.statusCode === 307 ||
          res.statusCode === 308) &&
        res.headers.location
      ) {
        lastRedirectUrl = new URL(String(res.headers.location), currentUrl).href;
        currentUrl = lastRedirectUrl;
        redirectsCount++;
        continue;
      }

      const duration = Date.now() - startTime;
      const is200Ok = res.statusCode >= 200 && res.statusCode < 400;
      const isWafProtected = res.statusCode === 403 || res.statusCode === 429;
      const isBroken = res.statusCode === 404 || res.statusCode >= 500;

      return {
        status: res.statusCode,
        statusText:
          res.statusCode === 200
            ? '200 OK'
            : res.statusCode === 404
            ? '404 Not Found'
            : res.statusCode === 403
            ? '403 WAF / Geoblock (Reachable)'
            : `${res.statusCode}`,
        responseTimeMs: duration,
        isReachable: is200Ok || isWafProtected,
        isBroken,
        redirectUrl: lastRedirectUrl,
      };
    }

    return {
      status: 310,
      statusText: 'Too many redirects',
      responseTimeMs: Date.now() - startTime,
      isReachable: false,
      isBroken: true,
      error: 'Exceeded max redirects',
    };
  } catch (err: any) {
    return {
      status: 0,
      statusText: err?.message || 'Connection Refused / Timeout',
      responseTimeMs: Date.now() - startTime,
      isReachable: false,
      isBroken: true,
      error: err?.message || 'Network Error',
    };
  }
}

async function runLinkIntegrityAudit() {
  console.log('========================================================================');
  console.log(' COMPLIANCEIQ - REGULATORY URL & PDF REACHABILITY AUDITOR');
  console.log(' Checking official sovereign statutory portals and PDF gazettes...');
  console.log('========================================================================\n');

  const itemsToCheck: Array<{
    regulationId: string;
    regulationCode: string;
    authority: string;
    country: string;
    url: string;
    isPdf: boolean;
  }> = [];

  for (const reg of MENAT_REGULATIONS) {
    if (reg.officialUrl) {
      itemsToCheck.push({
        regulationId: reg.id,
        regulationCode: reg.code,
        authority: reg.authorityShort || reg.authority,
        country: reg.countryId.toUpperCase(),
        url: reg.officialUrl,
        isPdf: reg.officialUrl.toLowerCase().endsWith('.pdf'),
      });
    }

    if (reg.documentPdfUrl && reg.documentPdfUrl !== reg.officialUrl) {
      itemsToCheck.push({
        regulationId: reg.id,
        regulationCode: `${reg.code} (PDF)`,
        authority: reg.authorityShort || reg.authority,
        country: reg.countryId.toUpperCase(),
        url: reg.documentPdfUrl,
        isPdf: true,
      });
    }
  }

  console.log(`Found ${itemsToCheck.length} statutory URLs to audit across MENAT jurisdictions.\n`);

  const results: LinkCheckResult[] = [];
  const batchSize = 12;

  for (let i = 0; i < itemsToCheck.length; i += batchSize) {
    const chunk = itemsToCheck.slice(i, i + batchSize);
    const chunkResults = await Promise.all(
      chunk.map(async (item) => {
        const check = await verifyUrl(item.url);
        return {
          ...item,
          status: check.status,
          statusText: check.statusText,
          responseTimeMs: check.responseTimeMs,
          isReachable: check.isReachable,
          isBroken: check.isBroken,
          redirectUrl: check.redirectUrl,
          error: check.error,
        };
      })
    );
    results.push(...chunkResults);
    process.stdout.write(`Audited ${Math.min(i + batchSize, itemsToCheck.length)} / ${itemsToCheck.length} links...\r`);
  }

  console.log('\n\nAudit Complete! Detailed Summary:');
  console.log('------------------------------------------------------------------------');

  let reachableCount = 0;
  let brokenCount = 0;
  let pdfVerifiedCount = 0;
  let pdfMissingCount = 0;

  for (const r of results) {
    const pdfTag = r.isPdf ? '[PDF]' : '[WEB]';
    const statusSymbol = r.isReachable ? '✓ OK' : '✕ MISSING/BROKEN';
    if (r.isReachable) {
      reachableCount++;
      if (r.isPdf) pdfVerifiedCount++;
    } else {
      brokenCount++;
      if (r.isPdf) pdfMissingCount++;
    }

    console.log(
      `${statusSymbol.padEnd(16)} | ${pdfTag.padEnd(5)} | ${r.country.padEnd(4)} | ${r.regulationCode.padEnd(18)} | HTTP ${r.status.toString().padEnd(3)} | ${r.responseTimeMs}ms | ${r.url}`
    );
  }

  console.log('\n========================================================================');
  console.log(' AUDIT SUMMARY METRICS');
  console.log('========================================================================');
  console.log(`Total URLs Audited:      ${results.length}`);
  console.log(`Reachable / Verified:    ${reachableCount} (${((reachableCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`Broken / Missing:        ${brokenCount}`);
  console.log(`PDF Documents Verified:  ${pdfVerifiedCount}`);
  console.log(`PDF Documents Missing:   ${pdfMissingCount}`);
  console.log('========================================================================\n');

  if (brokenCount > 0) {
    console.warn(`WARNING: ${brokenCount} statutory URL(s) flagged for Admin Panel attention.`);
  } else {
    console.log('SUCCESS: All statutory regulatory URLs and PDF documents are reachable.');
  }

  return { results, reachableCount, brokenCount, pdfVerifiedCount, pdfMissingCount };
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runLinkIntegrityAudit()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal audit failure:', err);
      process.exit(1);
    });
}

export { runLinkIntegrityAudit, verifyUrl };
