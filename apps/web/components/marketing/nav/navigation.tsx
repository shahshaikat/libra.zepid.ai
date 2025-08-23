/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * navigation.tsx
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

"use client";

import type * as React from "react";
import Link from "next/link";
import { useState, useEffect } from "react";

import { cn } from "@libra/ui/lib/utils";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "./navigation-menu";
import type { ReactNode } from "react";
import { siteConfig } from "@/configs/site";
import { Logo } from "@/components/common/logo/LogoImage";
import * as m from '@/paraglide/messages';


interface ComponentItem {
    title: string;
    href: string;
    description: string;
}

interface MenuItem {
    title: string;
    href?: string;
    isLink?: boolean;
    content?: ReactNode;
}

interface NavigationProps {
    menuItems?: MenuItem[];
    components?: ComponentItem[];
    logo?: ReactNode;
    logoTitle?: string;
    logoDescription?: string;
    logoHref?: string;
    introItems?: {
        title: string;
        href: string;
        description: string;
    }[];
}

export default function Navigation({
    menuItems,
    components = [
    ],
    logo = <Logo />,
    logoTitle,
    logoDescription = m["nav.logo_description"](),

}: NavigationProps) {
    const [isHydrated, setIsHydrated] = useState(false);
    const [localeReady, setLocaleReady] = useState(false);

    // Prevent hydration mismatch by using default English labels until hydrated
    const defaultMenuItems: MenuItem[] = [
        {
            title: m["nav.features"](),
            isLink: true,
            href: "#features",
        },
        {
            title: m["nav.price"](),
            isLink: true,
            href: "#price",
        },
        {
            title: m["nav.documentation"](),
            isLink: true,
            href: siteConfig.url,
        },
    ];

    const getLocalizedMenuItems = (): MenuItem[] => {
        try {
            // Only attempt to get localized content if we're hydrated and locale is ready
            if (!isHydrated || !localeReady) {
                return defaultMenuItems;
            }

            return [
                {
                    title: m["nav.features"](),
                    isLink: true,
                    href: "#features",
                },
                {
                    title: m["nav.price"](),
                    isLink: true,
                    href: "#price",
                },
                {
                    title: m["nav.documentation"](),
                    isLink: true,
                    href: siteConfig.url,
                },
            ];
        } catch {
            // Fallback to default menu items if locale is not available
            return defaultMenuItems;
        }
    };

    const getLocalizedLogoTitle = (): string => {
        try {
            if (!isHydrated || !localeReady) {
                return logoTitle || "Zepid AI";
            }
            return logoTitle || m["nav.brand"]();
        } catch {
            return logoTitle || "Zepid AI";
        }
    };

    useEffect(() => {
        setIsHydrated(true);

        // Check if locale is ready after hydration
        const checkLocale = () => {
            try {
                // Try to get locale - if this succeeds without error, locale is ready
                import('@/paraglide/runtime').then(({ getLocale }) => {
                    getLocale(); // Test if locale is available
                    setLocaleReady(true);
                }).catch(() => {
                    // Retry after a short delay
                    setTimeout(checkLocale, 100);
                });
            } catch {
                // Retry after a short delay
                setTimeout(checkLocale, 100);
            }
        };

        checkLocale();
    }, []);

    const finalMenuItems = menuItems || getLocalizedMenuItems();
    return (
        <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
                {finalMenuItems.map((item, index) => {
                    return (
                        <NavigationMenuItem key={index}>
                            {item.isLink ? (
                                <NavigationMenuLink asChild>
                                    <Link href={item.href || ""} className={navigationMenuTriggerStyle()}>
                                        {item.title}
                                    </Link>
                                </NavigationMenuLink>
                            ) : (
                                <>
                                    <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        {item.content === "default" ? (
                                            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                                <li className="row-span-3">
                                                    <div
                                                        className="from-muted/30 to-muted/10 flex h-full w-full flex-col justify-end rounded-md bg-linear-to-b p-6 no-underline outline-hidden select-none focus:shadow-md cursor-pointer"
                                                        onClick={() => {
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                            }
                                                        }}
                                                    >
                                                        {logo}
                                                        <div className="mt-4 mb-2 text-lg font-medium">
                                                            {getLocalizedLogoTitle()}
                                                        </div>
                                                        <p className="text-muted-foreground text-sm leading-tight">
                                                            {logoDescription}
                                                        </p>
                                                    </div>
                                                </li>

                                            </ul>
                                        ) : item.content === "components" ? (
                                            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                                {components.map((component) => (
                                                    <ListItem
                                                        key={component.title}
                                                        title={component.title}
                                                        href={component.href}
                                                    >
                                                        {component.description}
                                                    </ListItem>
                                                ))}
                                            </ul>
                                        ) : (
                                            item.content
                                        )}
                                    </NavigationMenuContent>
                                </>
                            )}
                        </NavigationMenuItem>
                    )
                })}
            </NavigationMenuList>
        </NavigationMenu>
    );
}

function ListItem({
    className,
    title,
    children,
    ...props
}: React.ComponentProps<"a"> & { title: string }) {
    return (
        <li>
            <div
                data-slot="list-item"
                className={cn(
                    "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline outline-hidden transition-colors select-none cursor-pointer",
                    className,
                )}

                onClick={() => {
                    // If href property exists, navigate to it
                    if (props.href) {
                        window.location.href = props.href;
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        // If href property exists, navigate to it
                        if (props.href) {
                            window.location.href = props.href;
                        }
                    }
                }}
            >
                <div className="text-sm leading-none font-medium">{title}</div>
                <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                    {children}
                </p>
            </div>
        </li>
    );
}
