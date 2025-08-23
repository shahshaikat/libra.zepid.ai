/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * badge.ts
 * Copyright (C) 2025 Nextify Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 */

import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod/v4'
import type { AppContext } from '../types'

// Define the badge route with OpenAPI specification
export const badgeRoute = createRoute({
  method: 'get',
  path: '/badge.js',
  summary: 'Get Zepid badge script',
  description: 'Returns a JavaScript script that displays "Made with Zepid" badge on the website',
  tags: ['Badge'],
  responses: {
    200: {
      description: 'Badge script returned successfully',
      content: {
        'application/javascript': {
          schema: z.string().describe('JavaScript code for the badge').openapi('BadgeScript')
        }
      }
    }
  }
})

// Badge script content with embedded SVG and styles
const badgeScript = `
(function() {
  'use strict';

  // Avoid multiple badge insertions
  if (window.libraBadgeLoaded) return;
  window.libraBadgeLoaded = true;

  // Zepid SVG Logo (dark version) - direct embedding with proportional scaling
  const libraLogo = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 1500" preserveAspectRatio="xMidYMid meet" class="badge-logo">
      <g transform="translate(0,1500) scale(0.1,-0.1)" fill="#FFFFFF" stroke="none">
        <path d="M9585 12384 c-16 -2 -73 -9 -125 -15 -801 -88 -1669 -448 -2255 -934 -107 -89 -300 -280 -390 -386 -323 -385 -522 -829 -591 -1324 -24 -173 -15 -373 25 -565 113 -543 445 -1404 907 -2349 74 -151 133 -275 132 -277 -2 -2 -2026 146 -2345 171 -78 6 -83 6 -83 -12 0 -19 173 -1274 185 -1340 4 -24 11 -33 25 -33 20 0 3164 476 3214 486 l28 6 -45 47 c-145 151 -351 413 -504 641 -429 642 -683 1309 -754 1985 -15 142 -15 524 0 640 51 392 214 766 478 1095 84 105 262 284 367 370 295 239 713 443 1108 539 302 74 506 96 883 96 317 0 387 -5 590 -46 779 -156 1447 -685 1820 -1444 130 -262 197 -481 227 -730 16 -139 16 -571 0 -725 -82 -765 -326 -1584 -720 -2412 l-70 -146 122 -30 c243 -61 2492 -611 2510 -614 18 -3 31 46 148 511 71 282 127 515 125 517 -2 2 -468 94 -1037 204 -568 110 -1034 201 -1036 202 -1 2 18 50 43 108 391 911 694 1764 794 2238 53 250 52 618 -2 927 -130 735 -521 1343 -1170 1817 -552 403 -1300 689 -2019 772 -122 14 -493 20 -585 10z"/>
        <path d="M6930 4784 c-486 -34 -872 -105 -1170 -216 -228 -85 -391 -177 -545 -308 -128 -109 -150 -181 -142 -460 5 -184 23 -316 78 -560 31 -140 125 -487 137 -507 5 -9 1260 58 4852 258 2664 148 4848 270 4853 272 18 6 -738 238 -1288 395 -1847 529 -3597 900 -4960 1051 -547 61 -748 73 -1275 76 -267 1 -510 1 -540 -1z"/>
      </g>
    </svg>\`;

  // Create badge container
  function createBadge() {
    const badge = document.createElement('div');
    badge.id = 'libra-badge';
    
    // Create shadow DOM for style isolation
    const shadow = badge.attachShadow({ mode: 'closed' });
    
    // Badge styles
    const style = document.createElement('style');
    style.textContent = \`
      :host {
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        z-index: 999999 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      }
      
      .badge-container {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        color: white;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        user-select: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .badge-container:hover {
        background: rgba(0, 0, 0, 0.9);
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
        border-color: rgba(255, 255, 255, 0.2);
      }
      
      .badge-logo {
        width: 24px;
        height: 24px;
        color: #ffffff;
        transition: transform 0.3s ease;
      }
      
      .badge-container:hover .badge-logo {
        transform: rotate(10deg) scale(1.1);
      }
      
      .badge-text {
        font-size: 14px;
        font-weight: 500;
        letter-spacing: -0.01em;
      }
      
      @media (max-width: 768px) {
        :host {
          bottom: 15px !important;
          right: 15px !important;
        }
        
        .badge-container {
          padding: 6px 10px;
          font-size: 12px;
          gap: 6px;
        }
        
        .badge-logo {
          width: 20px;
          height: 20px;
        }
        
        .badge-text {
          font-size: 12px;
        }
      }
      
      @media (max-width: 480px) {
        .badge-text {
          display: none;
        }
        
        .badge-container {
          padding: 8px;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          justify-content: center;
        }
      }
    \`;
    
    // Badge HTML structure
    const badgeHtml = \`
      <a href="https://zepid.dev" target="_blank" rel="noopener noreferrer" class="badge-container" title="Made with Zepid">
        \${libraLogo}
        <span class="badge-text">Made with Zepid</span>
      </a>
    \`;
    
    shadow.appendChild(style);
    shadow.innerHTML += badgeHtml;
    
    return badge;
  }

  // Insert badge when DOM is ready
  function insertBadge() {
    const badge = createBadge();
    document.body.appendChild(badge);
    
    // Add entrance animation
    requestAnimationFrame(() => {
      badge.style.opacity = '0';
      badge.style.transform = 'translateY(20px) scale(0.9)';
      badge.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      
      requestAnimationFrame(() => {
        badge.style.opacity = '1';
        badge.style.transform = 'translateY(0) scale(1)';
      });
    });
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertBadge);
  } else {
    insertBadge();
  }
})();
`;

// Badge route handler implementation
export const badgeHandler = async (c: AppContext) => {
  // Set appropriate headers for JavaScript content
  c.header('Cache-Control', 'public, max-age=86400') // Cache for 24 hours
  c.header('Access-Control-Allow-Origin', '*') // Allow cross-origin requests
  c.header('X-Content-Type-Options', 'nosniff')

  // Return JavaScript with proper content type
  return new Response(badgeScript, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff'
    }
  })
} 