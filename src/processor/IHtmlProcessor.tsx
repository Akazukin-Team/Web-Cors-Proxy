interface IHtmlProcessor {
    getProcessorName(): string;
    getQuerySelector(): string;
    process(elem: HTMLElement): HTMLElement;
    processAsync(elem: HTMLElement): Promise<HTMLElement>;
    isLazyLoad(): boolean;
}

export { IHtmlProcessor };
