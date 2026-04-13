interface Location {
    readonly ancestorOrigins: DOMStringList;
    hash: string;
    host: string;
    hostname: string;
    href: string;
    toString(): string;
    readonly origin: string;
    pathname: string;
    port: string;
    protocol: string;
    search: string;
    assign(url: string | URL): void;
    reload(): void;
    replace(url: string | URL): void;
}

export { Location };
