import { Cookie, parse as parseCookie } from 'set-cookie-parser';

import { IValue, cloneDocumentCookie, setDocumentCookie, decodeBrowserCookies } from './cookieUtil';

class CookieGuard {
    private _original: IValue<string>;
    private _buffer: { [key: string]: Cookie & { raw: string } } = {};
    private _blockEnabled: boolean;

    public defaultCookieExpirationMs = 365 * 86400 * 1000;

    init({ defaultBlocked }: { defaultBlocked: boolean }) {
        this._original = cloneDocumentCookie();
        this._blockEnabled = defaultBlocked;

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
                if (this.blockEnabled) {
                    for (const c of parseCookie(v)) {
                        this._buffer[c.name] = {
                            ...c,
                            raw: v,
                        };
                    }
                } else {
                    this._original.set(v);
                }
            },
        };

        setDocumentCookie(proxy);
    }

    get blockEnabled(): boolean {
        return this._blockEnabled;
    }

    set blockEnabled(value: boolean) {
        this._blockEnabled = value;
        if (value) {
            this.moveBrowserToBuffer();
        } else {
            this.moveBufferToBrowser();
        }
    }

    private moveBrowserToBuffer() {
        for (const [name, value] of decodeBrowserCookies(this._original.get())) {
            this._buffer[name] = {
                name: name,
                value: value,
                raw: `${name}=${value}; expires=${this.defaultCookieExpires()}`,
            };
            this._original.set(`${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT`);
        }
    }

    private moveBufferToBrowser() {
        for (const [_, c] of Object.entries(this._buffer)) {
            this._original.set(c.raw);
        }
        this._buffer = {};
    }

    private defaultCookieExpires(): string {
        const ms = new Date().getTime() + this.defaultCookieExpirationMs;
        return new Date(ms).toUTCString();
    }
}

export const cookieGuard = new CookieGuard();
