import { Fetcher } from "../Fetcher";
import { IHtmlProcessor } from "./IHtmlProcessor";

class HrefProcessor implements IHtmlProcessor {
    private baseUrl: URL;
    private fetcher: Fetcher;

    constructor(fetcher: Fetcher, baseUrl: URL) {
        this.fetcher = fetcher;
        this.baseUrl = baseUrl;
    }

    getProcessorName(): string {
        return "Href Processor";
    }

    getQuerySelector(): string {
        return "a[href]";
    }

    process(elem: HTMLElement): HTMLElement {
        // 非同期処理のため、同期処理では元の要素を返す
        this.processAsync(elem).catch((error) =>
            console.warn("Failed to process href element:", error)
        );
        return elem;
    }

    async processAsync(elem: HTMLElement): Promise<HTMLElement> {
        if (!(elem instanceof HTMLAnchorElement)) {
            console.warn("Element is not an anchor element");
            return elem;
        }

        const link = elem as HTMLAnchorElement;
        const href: string | null = link.getAttribute("href");

        // 外部URL以外の場合は処理をスキップ
        if (!href || !(href.startsWith("http:") || href.startsWith("https:"))) {
            return elem;
        }

        const absoluteUrl = this.fetcher.resolveUrl(href, this.baseUrl);
        const newContent = `javascript:window.parent.postMessage({ type: "REDIRECT", url: "${absoluteUrl.href}" }, "*");`;

        const newElem = elem.cloneNode(true) as HTMLAnchorElement;

        newElem.setAttribute("onclick", newContent);
        newElem.setAttribute("href", absoluteUrl.href);
        newElem.removeAttribute("target");
        return newElem;
    }

    isLazyLoad(): boolean {
        return false;
    }
}

export { HrefProcessor };
