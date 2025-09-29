import { fetcher } from "./Fetcher";
import { ViewManager } from "./ViewManager";

class IFrameMessenger {
    private viewMgr: ViewManager;

    constructor(viewMgr: ViewManager) {
        this.viewMgr = viewMgr;
    }

    public register(): void {
        window.addEventListener("message", this.onMessage.bind(this), false);
    }

    public onMessage(event: MessageEvent<any>): void {
        if (event.source !== this.viewMgr.getFrame().contentWindow) {
            return;
        }
        //const data = JSON.parse(event.data);

        if (event.data.type === "REDIRECT") {
            console.log("Redirecting to:", event.data.url);
            this.viewMgr.updateAndDisplayWithUrl(event.data.url);
        } else if (event.data.type === "NAVIGATE") {
            console.log("Navigating to:", event.data.url);
            const url = fetcher.resolveUrl(
                event.data.url,
                this.viewMgr.getCurrentPage().getUrl()
            );
            this.viewMgr.displayWithUrl(url.href);
        } else if (event.data.type === "MESSAGE") {
            console.log("Message from iframe:", event.data.url);
        }
    }
}

export { IFrameMessenger };
