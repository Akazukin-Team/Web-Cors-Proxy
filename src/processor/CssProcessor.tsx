import { Fetcher } from "../Fetcher";
import { IHtmlProcessor } from "./IHtmlProcessor";
import { utl } from "../Utils";

class CssProcessor implements IHtmlProcessor {
    private baseUrl: URL;
    private fetcher: Fetcher;

    constructor(fetcher: Fetcher, baseUrl: URL) {
        this.fetcher = fetcher;
        this.baseUrl = baseUrl;
    }

    getProcessorName(): string {
        return "Css Processor";
    }

    getQuerySelector(): string {
        return 'link[rel="stylesheet"]';
    }

    process(elem: HTMLElement): HTMLElement {
        let newElem = elem;
        Promise.resolve()
            .then(async () => (newElem = await this.processAsync(elem)))
            .catch((error) =>
                console.warn("Failed to process script element:", error)
            );
        return newElem;
    }

    async processAsync(elem: HTMLElement): Promise<HTMLElement> {
        if (!(elem instanceof HTMLLinkElement)) {
            console.warn("Element is not a link element");
            return elem;
        }

        const link = elem as HTMLLinkElement;
        const href: string | null = link.getAttribute("href");
        if (!href) return elem;

        const absoluteUrl = utl.resolveUrl(href, this.baseUrl);
        if (utl.isIgnoreUrl(absoluteUrl)) {
            console.warn("Ignoring CSS from:", absoluteUrl);
            return elem;
        }

        try {
            const cssContent = await this.fetcher.fetchAsText(absoluteUrl);
            const processedCss = await utl.processCss(cssContent, absoluteUrl);

            const newElem = elem.ownerDocument!.createElement("style");

            newElem.textContent = processedCss;
            return newElem;
        } catch (error) {
            console.warn(`Failed to fetch CSS: ${absoluteUrl}`, error);
            return elem;
        }
    }

    isLazyLoad(): boolean {
        return true;
    }
}

export { CssProcessor };
