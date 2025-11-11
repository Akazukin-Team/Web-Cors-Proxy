import { IHtmlProcessor } from "./processor/IHtmlProcessor";
import { ImageProcessor } from "./processor/ImageProcessor";
import { ScriptProcessor } from "./processor/ScriptProcessor";
import { CssProcessor } from "./processor/CssProcessor";
import { InlineStyleProcessor } from "./processor/InlineStyleProcessor";
import { HrefProcessor } from "./processor/HrefProcessor";
import { ScriptFixProcessor } from "./processor/ScriptFixProcessor";
import { Fetcher, fetcher } from "./Fetcher";

class ProcessManager {
    private readonly fetcher: Fetcher;

    constructor(fetcher: Fetcher) {
        this.fetcher = fetcher;
    }

    public async process(doc: Document, url: URL): Promise<void> {
        const processors: IHtmlProcessor[] = [
            new ImageProcessor(this.fetcher, url),
            new ScriptProcessor(this.fetcher, url),
            new CssProcessor(this.fetcher, url),
            new InlineStyleProcessor(url),
            new HrefProcessor(url),
            new ScriptFixProcessor(url),
        ];

        // History API のオーバーライド
        const historyScript = doc.createElement("script");
        historyScript.type = "text/javascript";
        historyScript.textContent = `
            history.replaceState = function(state, title, url) {
                window.parent.postMessage({ type: 'NAVIGATE', url: url }, '*');
            };
            history.pushState = function(state, title, url) {
                window.parent.postMessage({ type: 'REDIRECT', url: url }, '*');
            };
            //console.log(window.location);
        `;
        doc.head?.appendChild(historyScript);
        for (const processor of processors) {
            const elements: HTMLElement[] = Array.from(
                doc.querySelectorAll(processor.getQuerySelector())
            );

            for (let i = 0, len = elements.length; i < len; i = (i + 1) | 0) {
                const oldElem = elements[i];
                const res = await processor
                    .processAsync(oldElem)
                    .catch((error) => {
                        console.warn("Error processing element:", error);
                        return oldElem;
                    });
                if (res === oldElem) {
                    continue;
                }
                /*console.log(
                    `Processed element with ${processor.getProcessorName()}, ${
                        res.outerHTML
                    }`
                );*/
                oldElem.parentNode!.replaceChild(res, oldElem);
            }
            console.log("Processing complete.");
        }

        console.log("Initial processing complete.");
    }
}

const procMgr = new ProcessManager(fetcher);

export { ProcessManager, procMgr };
