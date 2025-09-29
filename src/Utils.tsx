import { Fetcher, fetcher } from "./Fetcher";

class Utils {
    private readonly fetcher: Fetcher;
    constructor(fetcher: Fetcher) {
        this.fetcher = fetcher;
    }

    spliceArray(arr: any[], num: number): any[][] {
        const length = Math.ceil(arr.length / num);
        return new Array(length)
            .fill(0, 0, length)
            .map((_, i) => arr.slice(i * num, (i + 1) * num));
    }

    async processCss(cssContent: string, baseUrl: URL): Promise<string> {
        const urlRegex = /url\(['"]?([^'")]+)['"]?\)/g;
        let processedCss = cssContent;

        const matches = Array.from(cssContent.matchAll(urlRegex));
        const promises = matches.map(async (match) => {
            const originalUrl = match[1];
            const absoluteUrl = this.fetcher.resolveUrl(originalUrl, baseUrl);

            if (this.isIgnoreUrl(absoluteUrl)) {
                console.warn("Ignoring CSS from:", absoluteUrl);
                return null;
            }

            try {
                const dataUrl = await this.fetcher.fetchAsBlobUrl(absoluteUrl);
                return { original: match[0], replacement: `url('${dataUrl}')` };
            } catch (error) {
                console.warn(
                    `Failed to fetch CSS resource: ${absoluteUrl}`,
                    error
                );
                return null;
            }
        });

        const results = await Promise.all(promises);

        for (const result of results) {
            if (result) {
                processedCss = processedCss.replace(
                    result.original,
                    result.replacement
                );
            }
        }

        return processedCss;
    }

    public isIgnoreUrl(url: URL): boolean {
        return (
            url.hostname == "fonts.googleapis.com" ||
            url.hostname == "www.googletagmanager.com" ||
            url.hostname == "code.jquery.com" ||
            url.hostname == "cdn.jsdelivr.net" ||
            url.hostname == "www.google.com" ||
            url.hostname == "cse.google.com" ||
            url.hostname == "www.google-analytics.com" ||
            url.hostname == "dmp.im-apps.net" ||
            url.hostname == "static.cloudflareinsights.com"
        );
    }
}

const utl = new Utils(fetcher);

export { Utils, utl };
