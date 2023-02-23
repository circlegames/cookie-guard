import { expect } from '@jest/globals';

import { cookieGuard } from '../src';
import { cloneDocumentCookie, decodeBrowserCookies } from '../src/cookieUtil';

function expectBrowserCookies(s: string) {
    return expect(Object.fromEntries(decodeBrowserCookies(s)));
}

describe('cookie guard', () => {
    const original = cloneDocumentCookie();
    cookieGuard.init({ defaultBlocked: true, preserveBlocked: false });

    it('block unblock', () => {
        cookieGuard.blockEnabled = true;

        expect(document.cookie).toEqual('');
        expect(original.get()).toEqual('');

        document.cookie = 'name1=value1';
        document.cookie = 'name3=value3';

        expectBrowserCookies(document.cookie).toEqual({ name1: 'value1', name3: 'value3' });
        expectBrowserCookies(original.get()).toEqual({});

        cookieGuard.blockEnabled = false;

        expectBrowserCookies(document.cookie).toEqual({ name1: 'value1', name3: 'value3' });
        expectBrowserCookies(original.get()).toEqual({ name1: 'value1', name3: 'value3' });

        document.cookie = 'name2=value2';
        expectBrowserCookies(document.cookie).toEqual({ name1: 'value1', name2: 'value2', name3: 'value3' });
        expectBrowserCookies(original.get()).toEqual({ name1: 'value1', name2: 'value2', name3: 'value3' });

        cookieGuard.blockEnabled = true;

        expectBrowserCookies(document.cookie).toEqual({ name1: 'value1', name2: 'value2', name3: 'value3' });
        expectBrowserCookies(original.get()).toEqual({});

        document.cookie = 'name2=value2new';

        expectBrowserCookies(document.cookie).toEqual({ name1: 'value1', name2: 'value2new', name3: 'value3' });
        expectBrowserCookies(original.get()).toEqual({});

        cookieGuard.blockEnabled = false;

        expectBrowserCookies(document.cookie).toEqual({ name1: 'value1', name2: 'value2new', name3: 'value3' });
        expectBrowserCookies(original.get()).toEqual({ name1: 'value1', name2: 'value2new', name3: 'value3' });
    });
});
