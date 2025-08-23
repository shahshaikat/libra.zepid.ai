/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * inspector.ts
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

import type { Hono } from 'hono'
import type { Bindings, Variables } from './types'

export function registerInspectorRoutes(app: Hono<{ Bindings: Bindings, Variables: Variables }>) {
  // Add component inspector page route
  app.get('/inspector', async (c) => {
    // Check if we're in development mode
    const isDev = (c.env.ENVIRONMENT as string) !== 'production' &&
      c.env.NODE_ENV !== 'production'
    if (!isDev) {
      return c.notFound()
    }
    const inspectorHtml = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zepid Component Inspector</title>
    <style>
      :root {
        /* Basic design variables */
        --brand: oklch(66.5% 0.1804 47.04);
        --brand-foreground: oklch(0.98 0.01 95.1);
        --background: oklch(0.98 0.01 95.1);
        --foreground: oklch(0.34 0.03 95.72);
        --primary: oklch(0.62 0.14 39.04);
        --primary-foreground: oklch(1.0 0 0);
        --secondary: oklch(0.92 0.01 92.99);
        --secondary-foreground: oklch(0.43 0.02 98.6);
        --muted: oklch(0.93 0.02 90.24);
        --muted-foreground: oklch(0.61 0.01 97.42);
        --accent: oklch(0.92 0.01 92.99);
        --accent-foreground: oklch(0.27 0.02 98.94);
        --border: oklch(0.88 0.01 97.36);
        --input: oklch(0.76 0.02 98.35);
        --ring: oklch(0.87 0.0671 252);
        --font-sans: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        --font-mono: 'Mona Sans', 'SF Mono', SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas, monospace;
        --radius: 0.5rem;
        --radius-sm: 0.3rem;
        --radius-full: 9999px;
        --chart-1: oklch(0.56 0.13 43.0);
        --destructive: oklch(0.64 0.21 25.33);
        --success: oklch(0.62 0.15 145.0);
        --warning: oklch(0.81 0.19 78.0);
        --info: oklch(0.7 0.1 255.0);
        
        /* Component-specific styles */
        --header-bg: var(--primary);
        --header-fg: var(--primary-foreground);
        --controls-bg: var(--background);
        --sidebar-border: var(--border);
        --sidebar-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
        
        /* Animation timing */
        --transition-fast: 0.15s;
        --transition-normal: 0.25s;
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        :root {
          --background: oklch(0.27 0.0 106.64);
          --foreground: oklch(0.81 0.01 93.01);
          --primary: oklch(0.67 0.13 38.76);
          --primary-foreground: oklch(1.0 0 0);
          --secondary: oklch(0.21 0.01 95.42);
          --secondary-foreground: oklch(0.92 0.0 106.48);
          --muted: oklch(0.22 0.0 106.71);
          --muted-foreground: oklch(0.77 0.02 99.07);
          --accent: oklch(0.21 0.01 95.42);
          --accent-foreground: oklch(0.97 0.01 98.88);
          --border: oklch(0.36 0.01 106.89);
          --destructive: oklch(0.64 0.21 25.33);
          --success: oklch(0.45 0.12 145.0);
          --sidebar-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
        }
      }
      
      /* Basic reset */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: var(--font-sans);
        background-color: var(--background);
        color: var(--foreground);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        font-size: 14px;
        line-height: 1.5;
      }
      
      /* Main container */
      .container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
      }
      
      /* Page header */
      .header {
        background-color: var(--header-bg);
        color: var(--header-fg);
        padding: 0.75rem 1.25rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        position: relative;
        z-index: 10;
      }
      
      .header h1 {
        font-size: 1.25rem;
        font-weight: 600;
        letter-spacing: -0.01em;
      }
      
      /* Connection status indicator */
      .connection-status {
        display: flex;
        align-items: center;
        font-size: 0.8125rem;
      }
      
      .status-indicator {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: var(--radius-full);
        margin-right: 0.5rem;
        transition: background-color var(--transition-fast) ease;
      }
      
      .status-indicator.connected {
        background-color: var(--success);
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
      }
      
      .status-indicator.disconnected {
        background-color: var(--destructive);
        box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
      }
      
      /* Control area */
      .controls {
        padding: 0.75rem 1.25rem;
        background-color: var(--controls-bg);
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .controls button {
        background-color: var(--secondary);
        color: var(--secondary-foreground);
        border: 1px solid var(--border);
        padding: 0.5rem 0.875rem;
        border-radius: var(--radius);
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        transition: all var(--transition-fast) ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
      
      .controls button:hover {
        background-color: var(--accent);
        border-color: var(--border);
      }
      
      .controls button.active {
        background-color: var(--primary);
        color: var(--primary-foreground);
        border-color: var(--primary);
      }
      
      /* Main content area */
      .main-content {
        display: flex;
        flex: 1;
        height: calc(100vh - 106px);
        position: relative;
        overflow: hidden;
      }
      
      /* iframe container */
      .iframe-container {
        flex: 1;
        background-color: var(--background);
        position: relative;
        transition: width var(--transition-normal) ease;
      }
      
      iframe {
        width: 100%;
        height: 100%;
        border: none;
        background-color: white;
        display: block;
      }
      
      /* Sidebar */
      .sidebar {
        width: 320px;
        background-color: var(--background);
        border-left: 1px solid var(--sidebar-border);
        padding: 1.25rem;
        overflow-y: auto;
        display: none;
        box-shadow: var(--sidebar-shadow);
        animation: slideIn var(--transition-normal) ease forwards;
      }
      
      .sidebar.visible {
        display: block;
      }
      
      /* Component information display */
      .component-info {
        margin-bottom: 1.5rem;
      }
      
      .component-info h3 {
        margin-bottom: 0.5rem;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--foreground);
      }
      
      .component-info p {
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
        color: var(--muted-foreground);
        padding-bottom: 0.75rem;
        border-bottom: 1px dashed var(--border);
      }
      
      .properties {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 1rem;
      }
      
      .property {
        margin-bottom: 0.5rem;
      }
      
      .property-name {
        font-weight: 600;
        font-size: 0.75rem;
        color: var(--muted-foreground);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
      }
      
      .property-value {
        font-family: var(--font-mono);
        font-size: 0.8125rem;
        background-color: var(--secondary);
        color: var(--secondary-foreground);
        padding: 0.5rem 0.75rem;
        border-radius: var(--radius-sm);
        word-break: break-all;
        line-height: 1.4;
        max-height: 120px;
        overflow-y: auto;
      }
      
      /* Animation effects */
      @keyframes slideIn {
        from {
          transform: translateX(20px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.8;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      /* Element selection highlight styles */
      .element-highlight-overlay {
        position: absolute;
        pointer-events: none;
        border: 2px dashed var(--primary);
        background-color: rgba(74, 108, 247, 0.1);
        border-radius: 2px;
        z-index: 9999;
        transition: all 0.2s ease;
      }

      /* Notification styles */
      .notification {
        position: fixed;
        top: 60px;
        right: 20px;
        padding: 12px 16px;
        background-color: var(--primary);
        color: var(--primary-foreground);
        border-radius: var(--radius);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        transform: translateX(100%);
        opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
        font-weight: 500;
        max-width: 300px;
      }
      
      .notification-success {
        background-color: var(--success);
      }
      
      .notification-error {
        background-color: var(--destructive);
      }
      
      .notification-warning {
        background-color: var(--warning);
        color: #000;
      }
      
      .notification-info {
        background-color: var(--info);
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header class="header">
        <h1>Zepid Component Inspector</h1>
        <div class="connection-status">
          <span class="status-indicator connected"></span>
          <span class="status-text">Connected</span>
        </div>
      </header>
      <div class="controls">
        <button id="toggle-select-mode" title="Select component mode">Select Component</button>
        <button id="toggle-sidebar" title="Show/hide sidebar">Show Details</button>
        <button id="refresh-iframe" title="Refresh iframe">Refresh</button>
      </div>
      <div class="main-content">
        <div class="iframe-container">
          <iframe id="preview-iframe" src="http://localhost:5173/" allow="cross-origin-isolated"></iframe>
        </div>
        <div class="sidebar" id="sidebar">
          <div class="component-info">
            <h3>No Component Selected</h3>
            <p>Please click the "Select Component" button, then select a component in the preview to view details.</p>
          </div>
        </div>
      </div>
    </div>

    <script>
      // Get DOM elements
      const iframe = document.getElementById('preview-iframe');
      const toggleSelectButton = document.getElementById('toggle-select-mode');
      const toggleSidebarButton = document.getElementById('toggle-sidebar');
      const refreshButton = document.getElementById('refresh-iframe');
      const sidebar = document.getElementById('sidebar');
      const statusIndicator = document.querySelector('.status-indicator');
      const statusText = document.querySelector('.status-text');
      
      // State variables
      let isSelectModeActive = false;
      let isSidebarVisible = false;
      
      // Initialize
      window.addEventListener('load', () => {
        setupMessageHandling();
        // Wait for iframe to load
        iframe.addEventListener('load', () => {
          updateConnectionStatus(true);
        });

        // Handle iframe loading failure
        iframe.addEventListener('error', () => {
          updateConnectionStatus(false);
        });

        // Add button hover effects
        addButtonHoverEffects();
      });
      
      // Add button hover effects
      function addButtonHoverEffects() {
        const buttons = document.querySelectorAll('.controls button');
        buttons.forEach(button => {
          button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-1px)';
          });
          
          button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
          });
          
          button.addEventListener('mousedown', () => {
            button.style.transform = 'translateY(1px)';
          });
          
          button.addEventListener('mouseup', () => {
            button.style.transform = 'translateY(-1px)';
          });
        });
      }
      
      // Update connection status
      function updateConnectionStatus(connected) {
        if (connected) {
          statusIndicator.className = 'status-indicator connected';
          statusText.textContent = 'Connected';
          statusIndicator.style.animation = 'pulse 2s infinite';
        } else {
          statusIndicator.className = 'status-indicator disconnected';
          statusText.textContent = 'Disconnected';
          statusIndicator.style.animation = 'none';
        }
      }
      
      // Set up message handling
      function setupMessageHandling() {
        window.addEventListener('message', (event) => {
          // Security check to ensure message comes from iframe
          if (event.source !== iframe.contentWindow) return;
          
          const { type, payload } = event.data;
          
          switch (type) {
            case 'ELEMENT_CLICKED':
              handleElementClicked(payload);
              break;
            case 'COMPONENT_TREE':
              // Handle component tree data
              break;
            case 'SELECTOR_SCRIPT_LOADED':
              showNotification('Inspector script loaded', 'success');
              break;
            case 'RUNTIME_ERROR':
              showNotification('Error occurred: ' + payload.message, 'error');
              console.error('Runtime error:', payload);
              break;
            case 'CONSOLE_OUTPUT':
              break;
          }
        });
      }
      
      // Show notification
      function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification notification-' + type;
        notification.textContent = message;

        // Add to page
        document.body.appendChild(notification);

        // Show animation
        setTimeout(() => {
          notification.style.transform = 'translateX(0)';
          notification.style.opacity = '1';
        }, 10);
        
        // Auto hide
        setTimeout(() => {
          notification.style.transform = 'translateX(100%)';
          notification.style.opacity = '0';

          // Remove element
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 300);
        }, 3000);
      }
      
      // Handle element click event
      function handleElementClicked(elementData) {
        // Show sidebar
        if (!isSidebarVisible) {
          toggleSidebar();
        }

        // Update component information
        updateComponentInfo(elementData);

        // Show success message
        showNotification('Element selected: ' + (elementData.elementType || 'Unknown component'), 'success');
      }
      
      // Update component information
      function updateComponentInfo(data) {
        const componentInfo = document.querySelector('.component-info');

        if (!data) {
          componentInfo.innerHTML = '<h3>No Component Selected</h3><p>Please select a component in the preview to view details.</p>';
          return;
        }

        // Build component information HTML
        let html = \`
          <h3>\${data.elementType || 'Unknown Component'}</h3>
          <p class="file-info">\${data.fileName || 'unknown'} (line \${data.lineNumber || '?'})</p>
        \`;
        
        // Add property information
        html += '<div class="properties">';

        // Class name
        if (data.className) {
          html += \`
            <div class="property">
              <div class="property-name">className</div>
              <div class="property-value">\${data.className}</div>
            </div>
          \`;
        }
        
        // Text content
        if (data.textContent) {
          html += \`
            <div class="property">
              <div class="property-name">textContent</div>
              <div class="property-value">\${data.textContent}</div>
            </div>
          \`;
        }
        
        // Other attributes
        if (data.attributes && data.attributes.length > 0) {
          html += '<div class="property"><div class="property-name">Attributes</div>';
          html += '<div class="property-value">';
          
          data.attributes.forEach(attr => {
            html += \`<div><strong>\${attr.name}</strong>: \${attr.value}</div>\`;
          });
          
          html += '</div></div>';
        }
        
        // Child components
        if (data.children && data.children.length > 0) {
          html += '<div class="property"><div class="property-name">Child Components</div>';
          html += '<div class="property-value">';
          
          data.children.forEach(child => {
            html += \`<div>\${child.elementType || child.tagName || 'Unknown'} \${child.className ? \`(class: \${child.className})\` : ''}</div>\`;
          });
          
          html += '</div></div>';
        }
        
        // Position information
        if (data.rect) {
          html += \`
            <div class="property">
              <div class="property-name">Element Position</div>
              <div class="property-value">
                <div>Width: \${Math.round(data.rect.width)}px</div>
                <div>Height: \${Math.round(data.rect.height)}px</div>
                <div>Position: (\${Math.round(data.rect.left)}px, \${Math.round(data.rect.top)}px)</div>
              </div>
            </div>
          \`;
        }
        
        html += '</div>';
        
        componentInfo.innerHTML = html;
        
        // Add fade-in effect
        componentInfo.style.opacity = '0';
        componentInfo.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
          componentInfo.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          componentInfo.style.opacity = '1';
          componentInfo.style.transform = 'translateY(0)';
        }, 10);
      }
      
      // Toggle selection mode
      toggleSelectButton.addEventListener('click', () => {
        isSelectModeActive = !isSelectModeActive;
        toggleSelectButton.classList.toggle('active', isSelectModeActive);

        // Update button text
        toggleSelectButton.textContent = isSelectModeActive ? 'Exit Selection' : 'Select Component';
        
        // Send message to iframe
        iframe.contentWindow.postMessage({
          type: 'TOGGLE_SELECTOR',
          payload: isSelectModeActive
        }, '*');

        // Show notification
        showNotification(isSelectModeActive ? 'Component selection mode enabled' : 'Component selection mode disabled',
                         isSelectModeActive ? 'info' : 'warning');
      });
      
      // Toggle sidebar
      toggleSidebarButton.addEventListener('click', toggleSidebar);

      function toggleSidebar() {
        isSidebarVisible = !isSidebarVisible;
        sidebar.classList.toggle('visible', isSidebarVisible);
        toggleSidebarButton.textContent = isSidebarVisible ? 'Hide Details' : 'Show Details';

        // Adjust main content area layout
        if (isSidebarVisible) {
          sidebar.style.display = 'block';
        } else {
          setTimeout(() => {
            if (!isSidebarVisible) {
              sidebar.style.display = 'none';
            }
          }, 300);
        }
      }
      
      // Refresh iframe
      refreshButton.addEventListener('click', () => {
        showNotification('Refreshing preview...', 'info');
        iframe.src = iframe.src;
      });

      // Auto show tip when page loads
      setTimeout(() => {
        showNotification('Component inspector ready, click "Select Component" button to start inspection', 'info');
      }, 1000);
    </script>
  </body>
  </html>`;

    return c.html(inspectorHtml);
  });

  // Add route handling for inspect.min.js file
  app.get('/inspect.min.js', async (c) => {
    // Check if we're in development mode
    const isDev = (c.env.ENVIRONMENT as string) !== 'production' &&
      c.env.NODE_ENV !== 'production'
    if (!isDev) {
      return c.notFound()
    }
    return c.redirect('/inspect.js');
  });

  // Provide inspect.js file
  app.get('/inspect.js', async (c) => {
    // Check if we're in development mode
    const isDev = (c.env.ENVIRONMENT as string) !== 'production' &&
      c.env.NODE_ENV !== 'production'
    if (!isDev) {
      return c.notFound()
    }
    return c.text(`/**
 * Zepid Component Inspector Script
 * 
 * This script enables component inspection and interaction.
 * It's a simplified version for demonstration purposes.
 */

(function() {
  // Notify parent window that script has loaded
  if (window.parent) {
    window.parent.postMessage({
      type: 'SELECTOR_SCRIPT_LOADED',
      payload: {
        version: '1.0.0'
      }
    }, '*');
  }

  // Listen for messages from parent window
  window.addEventListener('message', function(event) {
    if (!event.data || !event.data.type) return;
    
    const { type, payload } = event.data;
    
    if (type === 'TOGGLE_SELECTOR') {
      // Activate/deactivate selection mode
      if (payload) {
        enableSelectionMode();
      } else {
        disableSelectionMode();
      }
    }
  });

  // Selection mode state
  let selectionModeActive = false;
  let hoveredElement = null;

  // Enable selection mode
  function enableSelectionMode() {
    if (selectionModeActive) return;
    selectionModeActive = true;
    
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleClick);

  }

  // Disable selection mode
  function disableSelectionMode() {
    if (!selectionModeActive) return;
    selectionModeActive = false;
    
    document.body.style.cursor = '';
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('mouseout', handleMouseOut);
    document.removeEventListener('click', handleClick);
    
    // Clear any highlighting
    if (hoveredElement) {
      hoveredElement.style.outline = '';
      hoveredElement = null;
    }

  }

  // Handle mouse hover
  function handleMouseOver(event) {
    if (!selectionModeActive) return;
    
    const target = event.target;
    
    // Ignore body and html elements
    if (target.tagName.toLowerCase() === 'html' || target.tagName.toLowerCase() === 'body') {
      return;
    }
    
    // Highlight element
    target.style.outline = '2px dashed #4a6cf7';
    hoveredElement = target;
  }

  // Handle mouse out
  function handleMouseOut(event) {
    if (!selectionModeActive || !hoveredElement) return;
    
    hoveredElement.style.outline = '';
    hoveredElement = null;
  }

  // Handle click
  function handleClick(event) {
    if (!selectionModeActive) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.target;
    
    // Ignore body and html elements
    if (target.tagName.toLowerCase() === 'html' || target.tagName.toLowerCase() === 'body') {
      return;
    }
    
    // Collect element information
    const elementData = {
      tagName: target.tagName,
      elementType: target.tagName.toLowerCase(),
      className: target.className,
      id: target.id,
      textContent: target.textContent?.substring(0, 100) + (target.textContent?.length > 100 ? '...' : ''),
      attributes: Array.from(target.attributes).map(attr => ({
        name: attr.name,
        value: attr.value
      })),
      rect: target.getBoundingClientRect(),
      fileName: 'sample-component.jsx', // Example file name
      lineNumber: 42, // Example line number
      children: Array.from(target.children).map(child => ({
        elementType: child.tagName.toLowerCase(),
        className: child.className,
        fileName: 'sample-component.jsx'
      }))
    };
    
    // Send element information to parent window
    if (window.parent) {
      window.parent.postMessage({
        type: 'ELEMENT_CLICKED',
        payload: elementData
      }, '*');
    }
    
  }
})();`, {
      headers: {
        'Content-Type': 'application/javascript'
      }
    });
  });

  return app;
}