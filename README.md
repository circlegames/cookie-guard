![logo](docs/logo.png)

# Cookie-Guard

Cookie-Guard is an open-source JavaScript library designed to manage cookie permissions in compliance with General Data
Protection Regulation (GDPR) standards. It intercepts JavaScript's calls to document.cookie and only
forwards the cookie data if the user has explicitly given permission.

If the user doesn't grant permission, Cookie-Guard smartly stores the cookie value in memory. In subsequent
interactions, your code will behave as if it's interacting with a real cookie, while the data is securely stored in
memory, ensuring GDPR compliance.

That means, that you can

- use all your JavaScript libraries for analytics and ads as usual, without them knowing that
  access to cookies was blocked. The only difference is that cookie data will not persist between page reopens.
- use all you JavaScript libraries right away after page load, before user gave any permission, and as soon as user has
  given permissions, all cookies from memory storage would flush to browser cookies and will persist between page
  reopens.

## Installation

To install Cookie-Guard, use npm:

```
npm install @circlegames/cookie-guard
```

Then, initialize the Cookie-Guard:

```
import { cookieGuard } from '@circlegames/cookie-guard';

cookieGuard.init({ name: 'all', regexp: /.*/, blocked: true });

// If user has given the permission
cookieGuard.setBlocked('all', false);

// If user has not given the permission
cookieGuard.setBlocked('all', true);
```

## Examples

You can configure different groups of cookies and block / unblock them individually, for example:

```
import { cookieGuard } from '@circlegames/cookie-guard';

cookieGuard.init(
    { name: 'analytics', regexp: /analytics_.*/, blocked: true }, 
    { name: 'ads', regexp: /ads_.*/, blocked: true }
);

// If user has given the permission to analytics but not to ads
cookieGuard.setBlocked('analytics', false);

// If user has given the permission to all cookies
cookieGuard.setBlocked('analytics', false);
cookieGuard.setBlocked('ads', false);

```

## Disclaimer

While Cookie-Guard assists with GDPR compliance, it does not guarantee it. Please consult with a legal professional for
complete GDPR compliance requirements.
