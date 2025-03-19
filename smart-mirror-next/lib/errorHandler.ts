'use client';

type ErrorDialogOptions = {
  title?: string;
  message: string;
  stack?: string;
};

/**
 * Shows an error dialog similar to the Next.js development error overlay
 */
export function showErrorDialog({ title = 'Application Error', message, stack }: ErrorDialogOptions): void {
  // Remove any existing error dialogs
  const existingDialog = document.getElementById('global-error-dialog');
  if (existingDialog) {
    existingDialog.remove();
  }

  // Create dialog container
  const dialogContainer = document.createElement('div');
  dialogContainer.id = 'global-error-dialog';
  dialogContainer.style.position = 'fixed';
  dialogContainer.style.inset = '0';
  dialogContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  dialogContainer.style.display = 'flex';
  dialogContainer.style.alignItems = 'center';
  dialogContainer.style.justifyContent = 'center';
  dialogContainer.style.zIndex = '9999';
  dialogContainer.style.fontFamily = 'system-ui, sans-serif';

  // Create dialog content
  const dialogContent = document.createElement('div');
  dialogContent.style.backgroundColor = '#ffffff';
  dialogContent.style.borderRadius = '8px';
  dialogContent.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  dialogContent.style.width = '100%';
  dialogContent.style.maxWidth = '600px';
  dialogContent.style.padding = '20px';
  dialogContent.style.maxHeight = '80vh';
  dialogContent.style.overflow = 'auto';

  // Dark mode support
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    dialogContent.style.backgroundColor = '#1e1e1e';
    dialogContent.style.color = '#ffffff';
  }

  // Title
  const titleElement = document.createElement('h2');
  titleElement.textContent = title;
  titleElement.style.fontSize = '20px';
  titleElement.style.fontWeight = 'bold';
  titleElement.style.marginBottom = '16px';
  titleElement.style.color = '#e00';

  // Message
  const messageElement = document.createElement('div');
  messageElement.style.marginBottom = '16px';
  messageElement.style.padding = '12px';
  messageElement.style.backgroundColor = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#2a2a2a' : '#f5f5f5';
  messageElement.style.borderRadius = '4px';
  messageElement.style.fontFamily = 'monospace';
  messageElement.style.whiteSpace = 'pre-wrap';
  messageElement.style.overflow = 'auto';
  messageElement.textContent = message;

  // Stack trace (if provided)
  let stackElement;
  if (stack) {
    stackElement = document.createElement('pre');
    stackElement.textContent = stack;
    stackElement.style.fontSize = '12px';
    stackElement.style.marginBottom = '16px';
    stackElement.style.padding = '12px';
    stackElement.style.backgroundColor = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#2a2a2a' : '#f5f5f5';
    stackElement.style.borderRadius = '4px';
    stackElement.style.overflow = 'auto';
    stackElement.style.maxHeight = '200px';
  }

  // Button container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'space-between';

  // Reload button
  const reloadButton = document.createElement('button');
  reloadButton.textContent = 'Reload Page';
  reloadButton.style.padding = '8px 16px';
  reloadButton.style.backgroundColor = '#0070f3';
  reloadButton.style.color = 'white';
  reloadButton.style.border = 'none';
  reloadButton.style.borderRadius = '4px';
  reloadButton.style.cursor = 'pointer';
  reloadButton.addEventListener('click', () => {
    window.location.reload();
  });

  // Dismiss button
  const dismissButton = document.createElement('button');
  dismissButton.textContent = 'Dismiss';
  dismissButton.style.padding = '8px 16px';
  dismissButton.style.backgroundColor = '#555';
  dismissButton.style.color = 'white';
  dismissButton.style.border = 'none';
  dismissButton.style.borderRadius = '4px';
  dismissButton.style.cursor = 'pointer';
  dismissButton.addEventListener('click', () => {
    dialogContainer.remove();
  });

  // Assemble all elements
  buttonContainer.appendChild(reloadButton);
  buttonContainer.appendChild(dismissButton);
  dialogContent.appendChild(titleElement);
  dialogContent.appendChild(messageElement);
  if (stackElement) {
    dialogContent.appendChild(stackElement);
  }
  dialogContent.appendChild(buttonContainer);
  dialogContainer.appendChild(dialogContent);

  // Add to document
  document.body.appendChild(dialogContainer);
}

/**
 * Initialize global error handlers
 */
export function initGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    showErrorDialog({
      message: event.error?.message || 'An unknown error occurred',
      stack: event.error?.stack
    });
    // Don't prevent default so the error still gets logged to the console
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showErrorDialog({
      message: event.reason?.message || 'Unhandled Promise Rejection',
      stack: event.reason?.stack
    });
  });
} 