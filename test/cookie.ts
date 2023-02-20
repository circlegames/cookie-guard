import { expect } from '@jest/globals';

import { cookieGuard } from '../src';
import { cloneDocumentCookie, decodeBrowserCookies } from '../src/cookieUtil';

function expectBrowserCookies(s: string) {
    return expect(Object.fromEntries(decodeBrowserCookies(s)));
}

describe('cookie guard', () => {
    const original = cloneDocumentCookie();
    cookieGuard.init(
        {
            name: 'analytics',
            regexp: /^analytics.*$/,
            blocked: true,
        },
        {
            name: 'ads',
            regexp: /^ads.*$/,
            blocked: true,
        }
    );

    it('block unblock', () => {
        cookieGuard.setBlocked('analytics', true);
        cookieGuard.setBlocked('ads', true);

        expect(document.cookie).toEqual('');
        expect(original.get()).toEqual('');

        document.cookie = 'analytics_name1=value1';
        document.cookie = 'analytics_name3=value3';
        document.cookie = 'ads_name1=value1';

        expectBrowserCookies(document.cookie).toEqual({
            analytics_name1: 'value1',
            analytics_name3: 'value3',
            ads_name1: 'value1',
        });
        expectBrowserCookies(original.get()).toEqual({});

        cookieGuard.setBlocked('analytics', false);

        expectBrowserCookies(document.cookie).toEqual({
            analytics_name1: 'value1',
            analytics_name3: 'value3',
            ads_name1: 'value1',
        });
        expectBrowserCookies(original.get()).toEqual({
            analytics_name1: 'value1',
            analytics_name3: 'value3',
        });

        document.cookie = 'analytics_name2=value2';
        expectBrowserCookies(document.cookie).toEqual({
            analytics_name1: 'value1',
            analytics_name2: 'value2',
            analytics_name3: 'value3',
            ads_name1: 'value1',
        });
        expectBrowserCookies(original.get()).toEqual({
            analytics_name1: 'value1',
            analytics_name2: 'value2',
            analytics_name3: 'value3',
        });

        cookieGuard.setBlocked('analytics', true);

        expectBrowserCookies(document.cookie).toEqual({
            analytics_name1: 'value1',
            analytics_name2: 'value2',
            analytics_name3: 'value3',
            ads_name1: 'value1',
        });
        expectBrowserCookies(original.get()).toEqual({});

        document.cookie = 'analytics_name2=value2new';

        expectBrowserCookies(document.cookie).toEqual({
            analytics_name1: 'value1',
            analytics_name2: 'value2new',
            analytics_name3: 'value3',
            ads_name1: 'value1',
        });
        expectBrowserCookies(original.get()).toEqual({});

        cookieGuard.setBlocked('analytics', false);

        expectBrowserCookies(document.cookie).toEqual({
            analytics_name1: 'value1',
            analytics_name2: 'value2new',
            analytics_name3: 'value3',
            ads_name1: 'value1',
        });
        expectBrowserCookies(original.get()).toEqual({
            analytics_name1: 'value1',
            analytics_name2: 'value2new',
            analytics_name3: 'value3',
        });
    });
});
