import { FrameData, WebPage } from "./WebPage";
import { Fetcher } from "./Fetcher";
import { IFrameMessenger } from "./IFrameMessenger";
import { procMgr } from "./ProcessManager";

interface UIElements {
    urlInput: HTMLInputElement;
    fetchButton: HTMLButtonElement;
    loadingContainer: HTMLElement;
    errorContainer: HTMLElement;
    contentFrame: HTMLIFrameElement;
}

class ViewManager {
    private fetcher: Fetcher = new Fetcher();
    private readonly ui: UIElements;
    private currentPage: WebPage;
    private currentFrame: FrameData;
    private iframeMessenger: IFrameMessenger;

    public getCurrentFrame(): FrameData {
        return this.currentFrame;
    }

    private setLoadingState(isLoading: boolean): void {
        this.ui.fetchButton.disabled = isLoading;
        this.ui.loadingContainer.style.display = isLoading ? "block" : "none";
        this.ui.errorContainer.style.display = "none";
        this.ui.contentFrame.style.display = isLoading ? "none" : "block";
    }

    public getFrame(): HTMLIFrameElement {
        return this.ui.contentFrame;
    }

    constructor() {
        this.iframeMessenger = new IFrameMessenger(this);
        this.iframeMessenger.register();

        this.ui = this.initializeUIElements();
        this.setupEventListeners();
        this.displayWithUrl("https://example.com");
    }

    public async updateAndDisplay(): Promise<void> {
        const url = this.ui.urlInput.value.trim();
        await this.updateAndDisplayWithUrl(url);
    }

    private setupEventListeners(): void {
        this.ui.urlInput.addEventListener(
            "keypress",
            (event: KeyboardEvent) => {
                if (event.key === "Enter") {
                    this.updateAndDisplay();
                }
            }
        );

        this.ui.fetchButton.addEventListener("click", () => {
            this.updateAndDisplay();
        });
    }

    public getCurrentPage(): WebPage {
        return this.currentPage;
    }

    public async displayWithUrl(url: string): Promise<void> {
        if (!this.validateUrl(url)) {
            return;
        }

        try {
            const newPage: WebPage = new WebPage(this.fetcher, url);
            await this.displayContentOfPage(newPage);
        } catch (error) {
            console.error("Error fetching website:", error);
            this.showError(
                `サイトの取得に失敗しました: ${(error as Error).message}`
            );
        }
    }

    public async updateAndDisplayWithUrl(url: string): Promise<void> {
        if (!this.validateUrl(url)) {
            return;
        }
        this.ui.urlInput.value = url;
        await this.displayWithUrl(url);
    }

    public async displayContentOfPage(page: WebPage): Promise<void> {
        this.setLoadingState(true);

        try {
            this.currentPage = page;
            await page.load();
            let doc = await page.getFrame().getDocument();
            await procMgr.process(doc, page.getUrl());
            await page.getFrame().close();
            const newFrame = new FrameData(doc);
            page.setFrame(newFrame);
            await this.displayContentOfFrame(newFrame);
        } catch (error) {
            console.error("Error fetching website:", error);
            this.showError(
                `サイトの取得に失敗しました: ${(error as Error).message}`
            );
        }
    }

    private validateUrl(url: string): boolean {
        if (!url) {
            this.showError("URLを入力してください");
            return false;
        }

        if (!URL.canParse(url)) {
            this.showError("有効なURLを入力してください");
            return false;
        }

        return true;
    }

    private initializeUIElements(): UIElements {
        const getElement = <T extends HTMLElement>(id: string): T => {
            const element = document.getElementById(id) as T;
            if (!element) {
                throw new Error(`Element with id '${id}' not found`);
            }
            return element;
        };

        return {
            urlInput: getElement<HTMLInputElement>("urlInput"),
            fetchButton: getElement<HTMLButtonElement>("fetchButton"),
            loadingContainer: getElement<HTMLElement>("loadingContainer"),
            errorContainer: getElement<HTMLElement>("errorContainer"),
            contentFrame: getElement<HTMLIFrameElement>("contentFrame"),
        };
    }

    public async displayContentOfFrame(frame: FrameData): Promise<void> {
        const prevFrame: FrameData = this.currentFrame;
        this.currentFrame = frame;

        this.ui.contentFrame.src = await frame.getUrl();
        this.setLoadingState(false);

        if (prevFrame) {
            await prevFrame.close();
        }
    }

    private showError(message: string): void {
        this.ui.errorContainer.innerHTML = `<div class="error">${this.escapeHtml(
            message
        )}</div>`;
        this.ui.errorContainer.style.display = "block";
    }
    private escapeHtml(text: string): string {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
}

const viewMgr = new ViewManager();

// レガシーサポート
(window as any).updateAndDisplay = () => viewMgr.updateAndDisplay();
(window as any).updateAndDisplayWithUrl = (url: string) =>
    viewMgr.updateAndDisplayWithUrl(url);

export { ViewManager, viewMgr };
