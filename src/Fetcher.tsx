import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

class Fetcher {
    private readonly axiosConfig: AxiosRequestConfig;

    constructor() {
        this.axiosConfig = {
            withCredentials: false,
            timeout: 60 * 1000,
            responseEncoding: "utf8",

            headers: {
                "x-requested-with": "XMLHttpRequest",
                Accept: "*/*",
            },
        };
    }

    public async processUrl(url: URL): Promise<string> {
        if (!URL.canParse(url)) {
            throw new Error("Invalid URL");
        }
        const actUrl = new URL("https://cors-anywhere.azurewebsites.net/");
        const origin = `${url.hostname}:${
            !url.port ? (url.protocol == "https:" ? 443 : 80) : url.port
        }`;
        const distUrl = `${origin}${url.pathname}${url.search}`;
        const fetchUrl = new URL(actUrl);
        fetchUrl.pathname = distUrl;
        return fetchUrl.href;
    }

    public async fetchAsBlobUrl(url: URL): Promise<string> {
        const actUrl = await this.processUrl(url);

        try {
            const response: AxiosResponse<Blob> = await axios
                .get(actUrl, {
                    ...this.axiosConfig,
                    responseType: "blob",
                })
                .catch((error) => {
                    if (!error.response) {
                        throw error;
                    }
                    return error.response;
                });

            if (!response.data) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () =>
                    reject(new Error("Failed to read blob as data URL"));
                reader.readAsDataURL(response.data);
            });
        } catch (error) {
            console.warn(`Failed to fetch as data URL: ${url}`, error);
            throw error;
        }
    }

    public async fetchAsText(url: URL): Promise<string> {
        const actUrl = await this.processUrl(url);

        try {
            const response: AxiosResponse<ProxyResponse> = await axios
                .get(actUrl, { ...this.axiosConfig })
                .catch((error) => {
                    if (!error.response) {
                        throw error;
                    }
                    return error.response;
                });

            if (!response.data) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.data.toString() || "";
        } catch (error) {
            console.warn(`Failed to fetch text: ${url}`, error);
            throw error;
        }
    }
}

interface ProxyResponse {
    contents: string;
    status: {
        url: string;
        content_type: string;
        http_code: number;
        response_time: number;
    };
}

const fetcher = new Fetcher();

export { Fetcher, fetcher };
