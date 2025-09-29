import { Fetcher } from "./Fetcher";

class WebPage {
    private fetcher: Fetcher;

    private url: URL;
    private frame: FrameData;
    private loading: boolean;

    public getFrame(): FrameData {
        return this.frame;
    }

    public setFrame(frame: FrameData): void {
        this.frame = frame;
    }

    public constructor(fetcher: Fetcher, url: string) {
        this.fetcher = fetcher;
        this.url = new URL(url);
        this.loading = true;
    }

    public getUrl(): URL {
        return this.url;
    }

    public async load(): Promise<FrameData> {
        if (!this.loading) {
            await this.close();
        }

        this.loading = true;

        const htmlContent = await this.fetcher.fetchAsText(this.url);

        const parser = new DOMParser();
        const doc: Document = parser.parseFromString(htmlContent, "text/html");

        this.frame = new FrameData(doc);
        return this.frame;
    }

    public close(): void {
        this.loading = false;
        this.frame.close();
    }
}

class FrameData {
    private url: string;
    private doc: Document;

    constructor(doc: Document) {
        this.doc = doc;

        const blob = new Blob([doc.documentElement.outerHTML], {
            type: "text/html",
        });
        this.url = URL.createObjectURL(blob);
    }

    public getUrl(): string {
        return this.url;
    }

    public getDocument(): Document {
        return this.doc;
    }

    public close(): void {
        URL.revokeObjectURL(this.url);
    }
}

export { WebPage, FrameData };
