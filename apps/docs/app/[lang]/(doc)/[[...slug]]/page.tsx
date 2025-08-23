/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * page.tsx
 * Copyright (C) 2025 Nextify Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 *
 */

import { Heading } from "@/components/heading";
import { source } from "@/loaders/source";
import { Callout } from "fumadocs-ui/components/callout";
import defaultMdxComponents, { createRelativeLink } from "fumadocs-ui/mdx";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import { notFound, redirect } from "next/navigation";
import { Tabs } from "fumadocs-ui/components/tabs";
import { existsSync } from "node:fs";
import { join } from "node:path";

export const revalidate = 86400;

// Helper function to generate the correct GitHub edit path
function generateGitHubEditPath(slugs: string[], lang: string): string {
    const langSuffix = lang === 'zh' ? '.zh' : '';

    // Filter out any undefined, null, or empty values from slugs
    const cleanSlugs = slugs.filter(slug => slug && typeof slug === 'string' && slug.trim() !== '');

    if (cleanSlugs.length === 0) {
        // Fallback for empty slugs
        return `apps/docs/content/index${langSuffix}.mdx`;
    }

    // Try different file path patterns and check which one exists
    const contentBasePath = `content/${cleanSlugs.join('/')}`;

    // Pattern 1: Direct file naming (e.g., content/platform/guides/effective-ai-communication.zh.mdx)
    const directFilePath = `${contentBasePath}${langSuffix}.mdx`;
    const fullDirectPath = join(process.cwd(), directFilePath);

    // Pattern 2: Index file in folder (e.g., content/platform/account/index.zh.mdx)
    const indexFilePath = `${contentBasePath}/index${langSuffix}.mdx`;
    const fullIndexPath = join(process.cwd(), indexFilePath);

    // For GitHub path, we need the full path including apps/docs
    const githubDirectPath = `apps/docs/${directFilePath}`;
    const githubIndexPath = `apps/docs/${indexFilePath}`;

    // Check which file actually exists
    if (existsSync(fullDirectPath)) {
        return githubDirectPath;
    }

    if (existsSync(fullIndexPath)) {
        return githubIndexPath;
    }

    // Fallback to index format if neither exists (for new files)
    return githubIndexPath;
}

export default async function Page(props: {
    params: Promise<{ lang: string; slug?: string[] }>;
}) {
    const params = await props.params;
    const { lang, slug } = params;

    // Redirect root path to platform (default section)
    if (!slug || slug.length === 0) {
        redirect(`/${lang}/platform`);
    }

    const page = source.getPage(slug, lang);
    if (!page) notFound();

    const title = page.data.title;
    const description = page.data.description;

    const MDXContent = page.data.body;
    const toc = page.data.toc
        .filter((item) => item.depth <= 3)
        .map((item) => {
            return item;
        });

    return (
        <DocsPage
            toc={toc}
            tableOfContent={{ style: "clerk", single: false }}
            full={false}
            editOnGithub={{
                owner: "nextify-limited",
                repo: "libra",
                sha: "main",
                path: generateGitHubEditPath(page.slugs, lang),
            }}
        >
            {title && title !== "Intro" ? <DocsTitle>{title}</DocsTitle> : null}
            <DocsDescription>{description}</DocsDescription>
            <DocsBody {...{}}>
                <MDXContent
                    components={{
                        ...defaultMdxComponents,
                        // this allows you to link to other pages with relative file paths
                        a: createRelativeLink(source, page),
                        // you can add other MDX components here
                        blockquote: Callout,
                        Tabs,
                        h1: (props) => <Heading as="h1" {...props} />,
                        h2: (props) => <Heading as="h2" {...props} />,
                        h3: (props) => <Heading as="h3" {...props} />,
                        h4: (props) => <Heading as="h4" {...props} />,
                        h5: (props) => <Heading as="h5" {...props} />,
                        h6: (props) => <Heading as="h6" {...props} />,
                    }}
                />
            </DocsBody>
        </DocsPage>
    );
}

export async function generateStaticParams() {
    return source.generateParams();
}

export async function generateMetadata(props: {
    params: Promise<{ lang: string; slug?: string[] }>;
}) {
    const params = await props.params;
    const { lang, slug } = params;
    const page = source.getPage(slug, lang);
    if (!page) notFound();

    const rootTitle = page.data.title ?? "Home";
    const title = `${rootTitle} | Zepid AI`;
    const description = page.data.description;
    return {
        title,
        description,
        openGraph: {
            type: "website",
            title,
            description,
            siteName: "Libra Docs",
            url: `https://docs.zepid.dev/${lang}/${page.slugs.join("/")}`,
            images: [
                {
                    url: `/og.png?title=${encodeURIComponent(rootTitle)}&description=${encodeURIComponent(description ?? "")}&path=${encodeURIComponent(`${["zepid.dev", ...page.slugs].join("/")}`)}`,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            creator: "@nextify2024",
            site: "https://zepid.dev",
        },
        keywords: ["libra", "open source", "ai", "web coding", "vibe coding"],
    };
}
