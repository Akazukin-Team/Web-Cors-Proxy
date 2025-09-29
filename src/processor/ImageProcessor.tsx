import { Fetcher } from "../Fetcher";
import { IHtmlProcessor } from "./IHtmlProcessor";

class ImageProcessor implements IHtmlProcessor {
    private baseUrl: URL;
    private fetcher: Fetcher;

    constructor(fetcher: Fetcher, baseUrl: URL) {
        this.fetcher = fetcher;
        this.baseUrl = baseUrl;
    }

    getProcessorName(): string {
        return "Image Processor";
    }

    getQuerySelector(): string {
        return "img[src]";
    }

    process(elem: HTMLElement): HTMLElement {
        // 非同期処理のため、同期処理では元の要素を返す
        this.processAsync(elem).catch((error) =>
            console.warn("Failed to process image element:", error)
        );
        return elem;
    }

    async processAsync(elem: HTMLElement): Promise<HTMLElement> {
        if (!(elem instanceof HTMLImageElement)) {
            console.warn("Element is not an image element");
            return elem;
        }

        const imgElem = elem as HTMLImageElement;
        const src = imgElem.getAttribute("src");
        if (!src || src.startsWith("data:")) return elem;

        const absoluteUrl = this.fetcher.resolveUrl(src, this.baseUrl);

        try {
            const dataUrl: string = await this.fetcher.fetchAsBlobUrl(
                absoluteUrl
            );

            const newElem = elem.cloneNode(true) as HTMLImageElement;

            newElem.setAttribute("src", dataUrl);
            return newElem;
        } catch (error) {
            console.warn(`Failed to fetch image: ${absoluteUrl}`, error);
            return elem;
        }
    }

    isLazyLoad(): boolean {
        return true;
    }
}

export { ImageProcessor };
