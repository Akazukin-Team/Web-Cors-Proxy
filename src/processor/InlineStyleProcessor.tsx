import { IHtmlProcessor } from "./IHtmlProcessor";
import { utl } from "../Utils";

class InlineStyleProcessor implements IHtmlProcessor {
    private baseUrl: URL;

    constructor(baseUrl: URL) {
        this.baseUrl = baseUrl;
    }

    getProcessorName(): string {
        return "Inline Style Processor";
    }

    getQuerySelector(): string {
        return "[style]";
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
