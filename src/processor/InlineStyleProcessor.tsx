import { Fetcher } from "../Fetcher";
import { IHtmlProcessor } from "./IHtmlProcessor";
import { utl } from "../Utils";

class InlineStyleProcessor implements IHtmlProcessor {
    private baseUrl: URL;
    private fetcher: Fetcher;

    constructor(fetcher: Fetcher, baseUrl: URL) {
        this.fetcher = fetcher;
        this.baseUrl = baseUrl;
    }

    getProcessorName(): string {
        return "Inline Style Processor";
    }

    getQuerySelector(): string {
        return "[style]";
    }

    process(elem: HTMLElement): HTMLElement {
        // 非同期処理のため、同期処理では元の要素を返す
        this.processAsync(elem).catch((error) =>
            console.warn("Failed to process inline style element:", error)
        );
        return elem;
    }

    async processAsync(elem: HTMLElement): Promise<HTMLElement> {
        const style = elem.getAttribute("style");
        if (!style) return elem;

        try {
            const processedStyle = await utl.processCss(style, this.baseUrl);

            const newElem = elem.cloneNode(true) as HTMLElement;

            newElem.setAttribute("style", processedStyle);
            return newElem;
        } catch (error) {
            console.warn("Failed to process inline style", error);
            return elem;
        }
    }

    isLazyLoad(): boolean {
        return true;
    }
}

export { InlineStyleProcessor };
