import { Fetcher } from "../Fetcher";
import { IHtmlProcessor } from "./IHtmlProcessor";
import { utl } from "../Utils";

class ScriptProcessor implements IHtmlProcessor {
    private baseUrl: URL;
    private fetcher: Fetcher;

    constructor(fetcher: Fetcher, baseUrl: URL) {
        this.fetcher = fetcher;
        this.baseUrl = baseUrl;
    }

    getProcessorName(): string {
        return "Script Processor";
    }

    getQuerySelector(): string {
        return "script[src]";
    }

    process(elem: HTMLElement): HTMLElement {
        // 非同期処理のため、同期処理では元の要素を返す
        this.processAsync(elem).catch((error) =>
            console.warn("Failed to process script element:", error)
        );
        return elem;
    }

    async processAsync(elem: HTMLElement): Promise<HTMLElement> {
        if (!(elem instanceof HTMLScriptElement)) {
            console.warn("Element is not a script element");
            return elem;
        }

        const script = elem as HTMLScriptElement;
        const src = script.getAttribute("src");
        if (!src) return elem;

        const absoluteUrl = this.fetcher.resolveUrl(src, this.baseUrl);
        if (utl.isIgnoreUrl(absoluteUrl)) {
            console.warn("Ignoring script from:", absoluteUrl);
            return elem;
        }

        try {
            const scriptContent = await this.fetcher.fetchAsText(absoluteUrl);

            const newElem = elem.ownerDocument!.createElement("script");

            newElem.textContent = scriptContent;
            return newElem;
        } catch (error) {
            console.warn(`Failed to fetch script: ${absoluteUrl}`, error);
            return elem;
        }
    }

    isLazyLoad(): boolean {
        return false;
    }
}

export { ScriptProcessor };
