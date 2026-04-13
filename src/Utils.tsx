import {Fetcher, fetcher} from "./Fetcher";

import {viewMgr} from "./ViewManager";
import {parse} from "@babel/parser";
import {Location} from "./types/Location";
import t = require("@babel/types");

const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;

class Utils {
    private readonly fetcher: Fetcher;

    constructor(fetcher: Fetcher) {
        this.fetcher = fetcher;
    }

    spliceArray(arr: any[], num: number): any[][] {
        const length = Math.ceil(arr.length / num);
        return new Array(length)
            .fill(0, 0, length)
            .map((_, i) => arr.slice(i * num, (i + 1) * num));
    }

    public async processJs(jsContent: string, baseUrl: URL): Promise<string> {
        const ast = parse(jsContent);
        traverse(ast, {
            // 値取得によるLocationの取得を修正
            MemberExpression(path) {
                const {object, property} = path.node;

                // window.location のパターンをチェック
                if (
                    t.isIdentifier(object, {name: "window"}) &&
                    t.isIdentifier(property, {name: "location"})
                ) {
                    // 代入式の左辺（left）として使われている場合はスキップ
                    // (AssignmentExpressionで既に処理済み)
                    const parent = path.parent;
                    if (
                        t.isAssignmentExpression(parent) &&
                        parent.left === path.node
                    ) {
                        return;
                    }

                    const loc: Location = {
                        href: baseUrl.href,
                        protocol: baseUrl.protocol,
                        host: baseUrl.host,
                        hostname: baseUrl.hostname,
                        port: baseUrl.port,
                        pathname: baseUrl.pathname,
                        search: baseUrl.search,
                        hash: baseUrl.hash,
                        origin: baseUrl.origin,
                        ancestorOrigins: window.location.ancestorOrigins,

                        toString(): string {
                            return this.href;
                        },
                        assign(url: string | URL): void {
                            window.parent.postMessage(
                                {type: "REDIRECT", url: String(url)},
                                "*"
                            );
                        },
                        reload(): void {
                            window.parent.postMessage({type: "RELOAD"}, "*");
                        },
                        replace(url: string | URL): void {
                            window.parent.postMessage(
                                {type: "REDIRECT", url: String(url)},
                                "*"
                            );
                        },
                    };
                    loc.href = viewMgr.getCurrentPage().getUrl().href;

                    // window.location を "https://example.com" に置き換え

                    path.replaceWith(parse(JSON.stringify(loc)));
                }
            },
            // 値変更によるRedirectを修正
            AssignmentExpression: (path) => {
                const {left} = path.node;

                if (
                    t.isMemberExpression(left) &&
                    t.isIdentifier(left.object, {name: "window"}) &&
                    t.isIdentifier(left.property, {name: "location"})
                ) {
                    // window.parent.postMessage({ type: 'REDIRECT', url: url }, '*')
                    const postMessageCall = t.callExpression(
                        t.memberExpression(
                            t.memberExpression(
                                t.identifier("window"),
                                t.identifier("parent")
                            ),
                            t.identifier("postMessage")
                        ),
                        [
                            // 第1引数: { type: 'REDIRECT', url: url }
                            t.objectExpression([
                                t.objectProperty(
                                    t.identifier("type"),
                                    t.stringLiteral("REDIRECT")
                                ),
                                t.objectProperty(
                                    t.identifier("url"),
                                    path.node.right
                                ),
                            ]),
                            // 第2引数: '*'
                            t.stringLiteral("*"),
                        ]
                    );

                    // AssignmentExpressionをCallExpressionに置き換え
                    path.replaceWith(postMessageCall);
                }
            },
        });

        return generate(ast).code;
    }

    public resolveUrl(url: string, base: URL): URL {
        try {
            return new URL(url, base);
        } catch (error) {
            console.warn(`Failed to resolve URL: ${url}`, error);
            return new URL(url);
        }
    }

    async processCss(cssContent: string, baseUrl: URL): Promise<string> {
        const urlRegex = /url\(['"]?([^'")]+)['"]?\)/g;
        let processedCss = cssContent;

        const matches = Array.from(cssContent.matchAll(urlRegex));
        const promises = matches.map(async (match) => {
            const originalUrl = match[1];
            if (originalUrl.startsWith("data:")) return originalUrl;

            const absoluteUrl = utl.resolveUrl(originalUrl, baseUrl);

            if (this.isIgnoreUrl(absoluteUrl)) {
                console.warn("Ignoring CSS from:", absoluteUrl);
                return null;
            }

            try {
                const dataUrl = await this.fetcher.fetchAsBlobUrl(absoluteUrl);
                return {original: match[0], replacement: `url('${dataUrl}')`};
            } catch (error) {
                console.warn(
                    `Failed to fetch CSS resource: ${absoluteUrl}`,
                    error
                );
                return null;
            }
        });

        const results = await Promise.all(promises);

        for (const result of results) {
            if (result) {
                processedCss = processedCss.replace(
                    result.original,
                    result.replacement
                );
            }
        }

        return processedCss;
    }

    public isIgnoreUrl(url: URL): boolean {
        return (
            url.hostname == "fonts.googleapis.com" ||
            url.hostname == "www.googletagmanager.com" ||
            url.hostname == "code.jquery.com" ||
            url.hostname == "cdn.jsdelivr.net" ||
            url.hostname == "www.google.com" ||
            url.hostname == "cse.google.com" ||
            url.hostname == "www.google-analytics.com" ||
            url.hostname == "dmp.im-apps.net" ||
            url.hostname == "static.cloudflareinsights.com"
        );
    }
}

const utl = new Utils(fetcher);

export {Utils, utl};
