import {IHtmlProcessor} from "./IHtmlProcessor";
import {utl} from "../Utils";

class ScriptFixProcessor implements IHtmlProcessor {
    private readonly baseUrl: URL;

    constructor(baseUrl: URL) {
        this.baseUrl = baseUrl;
    }

    getProcessorName(): string {
        return "Script Fix Processor";
    }

    getQuerySelector(): string {
        return "script";
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
        if (!(elem instanceof HTMLScriptElement)) {
            console.warn("Element is not a script element");
            return elem;
        }

        const script = elem as HTMLScriptElement;
        const type = elem.getAttribute("type");
        if (type
            && !(type === "text/javascript"
                || type === "application/javascript"
                || type === "module")) {
            return elem;
        }

        const src = script.textContent;

        try {
            const scriptContent = await utl.processJs(src, this.baseUrl);

            const newElem = elem.ownerDocument!.createElement("script");
            newElem.textContent = scriptContent;
            return newElem;
        } catch (error) {
            console.warn(`Failed to fetch script: ${src}`, error);
            return elem;
        }
    }

    isLazyLoad(): boolean {
        return false;
    }
}

export {ScriptFixProcessor};
