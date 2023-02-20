import { Cookie, parse as parseCookie } from 'set-cookie-parser';

import { IValue, cloneDocumentCookie, setDocumentCookie, decodeBrowserCookies } from './cookieUtil';

interface CookieCategory {
    name: string;
    regexp: RegExp;
    blocked: boolean;
}

class CookieGuard {
    private _original: IValue<string>;
    private _buffer: { [key: string]: Cookie & { category: string; raw: string } } = {};
    private _categories: CookieCategory[];

    init(...categories: CookieCategory[]) {
        if (categories.length === 0) {
            throw new Error('cookie-guard: empty categories, please provide at least one category');
        }

        this._original = cloneDocumentCookie();
        this._categories = categories;

        const proxy = {
            get: () => {
                // if buffer is empty then return original browser cookies
                if (Object.keys(this._buffer).length === 0) {
                    return this._original.get();
                }

                // otherwise merge browser and buffer cookies
                const result: { [key: string]: string } = {};

                for (const [name, value] of decodeBrowserCookies(this._original.get())) {
                    result[name] = value;
                }

                // copy values from buffer to result
                const now = new Date();
                Object.values(this._buffer)
                    .filter((c) => c.expires === undefined || c.expires > now)
                    .forEach((c) => (result[c.name] = c.value));

                // encode to string
                return Object.entries(result)
                    .map(([name, value]) => `${name}=${value}`)
                    .join('; ');
            },
            set: (v: string) => {
                for (const c of parseCookie(v)) {
                    const category = this._categories.find((g) => g.regexp.test(c.name));
                    if (category && category.blocked) {
                        this._buffer[c.name] = {
                            ...c,
                            raw: v,
                            category: category.name,
                        };
                    } else {
                        this._original.set(v);
                    }
                }
            },
        };

        setDocumentCookie(proxy);
    }

    setBlocked(categoryName: string, value: boolean) {
        const category = this._categories.find((g) => g.name === categoryName);
        if (!category) {
            throw new Error(`cookie-guard: category with name "${categoryName}" was not configured`);
        }

        category.blocked = value;
        if (value) {
            this.moveBrowserToBuffer(category);
        } else {
            this.moveBufferToBrowser(category);
        }
    }

    private moveBrowserToBuffer(category: CookieCategory) {
        for (const [name, value] of decodeBrowserCookies(this._original.get())) {
            if (category.regexp.test(name)) {
                const expires = addYear(new Date()).toUTCString();
                this._buffer[name] = {
                    name: name,
                    value: value,
                    raw: `${name}=${value}; expires=${expires}`,
                    category: category.name,
                };
                this._original.set(`${name}=; expires=${epoch().toUTCString()}`);
            }
        }
    }

    private moveBufferToBrowser(category: CookieCategory) {
        for (const [_, c] of Object.entries(this._buffer)) {
            if (c.category === category.name) {
                this._original.set(c.raw);
                delete this._buffer[c.name];
            }
        }
    }
}

function addYear(d: Date): Date {
    const yearMs = 365 * 86400 * 1000;
    return new Date(d.getTime() + yearMs);
}

function epoch(): Date {
    return new Date(0);
}

export const cookieGuard = new CookieGuard();
