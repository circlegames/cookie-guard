export interface IValue<T> {
    get(): T;

    set(v: T): void;
}

function validateEnvironment() {
    if (typeof Document === 'undefined') {
        throw new Error('environment does not support document.cookie');
    }
    if (!navigator.cookieEnabled) {
        throw new Error('environment does not support or is blocking cookies from being set');
    }
}

export function cloneDocumentCookie(): IValue<string> {
    validateEnvironment();

    // In Chrome, Safari, Opera, Edge and IE9+ the cookie property is defined on `Document.prototype`,
    // whereas in Firefox it is defined on `HTMLDocument.prototype`.
    const descriptor =
        Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
        Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');

    if (!descriptor) {
        throw new Error('environment does not support document.cookie');
    }

    return {
        get: () => descriptor.get!.call(document),
        set: (v: string) => descriptor.set!.call(document, v),
    };
}

export function setDocumentCookie(c: IValue<string>) {
    validateEnvironment();

    const descriptor = Object.getOwnPropertyDescriptor(document, 'cookie');
    if (descriptor && descriptor.configurable === false) {
        throw new Error('cannot redefine non-configurable property "cookie"');
    }

    Object.defineProperty(document, 'cookie', {
        configurable: false,
        get: () => c.get(),
        set: (v: string) => c.set(v),
    });
}

export function decodeBrowserCookies(s: string): Array<[string, string]> {
    return s
        .split(';')
        .filter((s) => s)
        .map((v) => v.split('='))
        .map((v) => [v[0]!.trim(), v[1]!.trim()]);
}

export function decodeBrowserCookie(s: string, name: string): string | null {
    const t = decodeBrowserCookies(s).filter(([n]) => n === name)[0];
    return t ? t[1] : null;
}

export function encodeBrowserCookie(name: string, value: string): string {
    return `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
}
