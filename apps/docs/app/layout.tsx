/*
 * SPDX-License-Identifier: AGPL-3.0-only
 * layout.tsx
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

import "./global.css";
import type {ReactNode} from "react";
import {Inter} from "next/font/google";

const inter = Inter({
    subsets: ["latin"],
});

export default function RootLayout({children}: { children: ReactNode }) {
    return (
        <html className={inter.className} lang="en" suppressHydrationWarning>
            <body className="flex flex-col min-h-screen" suppressHydrationWarning={true}>
            {children}
        </body>
        </html>
    );
}