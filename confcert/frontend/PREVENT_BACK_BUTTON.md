# Prevent Browser Back Button

This document explains how to prevent users from using the browser back button and force them to use the in-app navigation.

## Usage

To prevent browser back button on specific pages, wrap your page content with the `PreventBrowserBack` component:

```jsx
import PreventBrowserBack from '@/components/PreventBrowserBack';

export default function MyPage() {
  return (
    <PreventBrowserBack>
      {/* Your page content */}
    </PreventBrowserBack>
  );
}
```

## How It Works

The `PreventBrowserBack` component:
1. Pushes current state to browser history
2. Listens for `popstate` events (browser back/forward button clicks)
3. Prevents default navigation and shows an alert
4. Keeps user on the current page

## When to Use

Use this component for:
- Payment/checkout pages
- Form submission pages
- Multi-step processes
- Blockchain transaction pages
- Security-sensitive pages

## When NOT to Use

Avoid using this for:
- Regular content pages
- Landing pages
- Documentation pages
- Public-facing pages

## Example Implementation

### Rental Agreement Payment Page
```jsx
"use client";
import PreventBrowserBack from '@/components/PreventBrowserBack';
import { useState } from 'react';

export default function PaymentPage() {
  return (
    <PreventBrowserBack>
      <div className="container">
        <h1>Complete Payment</h1>
        {/* Payment form */}
        <button onClick={() => router.push('/success')}>
          Complete Payment
        </button>
      </div>
    </PreventBrowserBack>
  );
}
```

## Customization

You can customize the alert message by modifying the component:

```jsx
// In PreventBrowserBack.js
alert('Custom message: Please use the Back button provided on this page.');
```

Or replace the alert with a custom modal/notification component.

## Browser Compatibility

Works on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Notes

- Users can still close the tab/window
- Users can still use Next.js router navigation (Link components)
- In-app back buttons using `router.push()` or `router.back()` still work
- This only prevents browser back/forward buttons
