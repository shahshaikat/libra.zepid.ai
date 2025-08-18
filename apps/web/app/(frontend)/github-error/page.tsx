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

"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@libra/ui/components/card";
import { AlertCircle, RefreshCw, Mail } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function GitHubErrorPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const reason = searchParams.get('reason');
	const [isClient, setIsClient] = useState(false);

	// Check if we're on the client side
	useEffect(() => {
		setIsClient(true);
	}, []);

	const getErrorMessage = (reason: string | null) => {
		switch (reason) {
			case 'cancelled':
				return {
					title: 'GitHub Integration Cancelled',
					description: 'You cancelled the GitHub App installation process.',
					details: 'No changes were made to your account. You can try again at any time.'
				};
			case 'missing_installation_id':
				return {
					title: 'Installation ID Missing',
					description: 'The GitHub installation could not be completed.',
					details: 'The installation ID was not provided by GitHub. Please try the setup process again.'
				};
			case 'invalid_state':
				return {
					title: 'Invalid Request State',
					description: 'The GitHub integration request is invalid.',
					details: 'The request state parameter could not be verified. This may be due to an expired or tampered request.'
				};
			case 'no_organization':
				return {
					title: 'Organization Not Found',
					description: 'No organization was specified for this integration.',
					details: 'The GitHub integration requires a valid organization context. Please ensure you\'re accessing this from within an organization.'
				};
			case 'processing':
				return {
					title: 'Processing Error',
					description: 'An error occurred while processing your GitHub integration.',
					details: 'We encountered an issue while setting up your GitHub integration. Please try again or contact support if the problem persists.'
				};
			case 'missing_code':
				return {
					title: 'Authorization Code Missing',
					description: 'The GitHub authorization process was incomplete.',
					details: 'No authorization code was received from GitHub. Please try the authentication process again.'
				};
			case 'missing_state':
				return {
					title: 'Request State Missing',
					description: 'The GitHub authentication request is missing required information.',
					details: 'The state parameter was not provided. Please start the GitHub integration process again.'
				};
			case 'invalid_nonce':
				return {
					title: 'Security Validation Failed',
					description: 'The GitHub integration request failed security validation.',
					details: 'This may be due to a replay attack or an expired request. Please try the integration process again.'
				};
			case 'unexpected':
				return {
					title: 'Unexpected Error',
					description: 'An unexpected error occurred during GitHub integration.',
					details: 'Something went wrong that we didn\'t anticipate. Please try again or contact our support team for assistance.'
				};
			default:
				return {
					title: 'GitHub Integration Error',
					description: 'An error occurred during GitHub integration.',
					details: `Error: ${reason || 'Unknown error'}. Please try again or contact our support team for assistance.`
				};
		}
	};

	const errorInfo = getErrorMessage(reason);

	const handleTryAgain = () => {
		// Navigate back to the setup flow or dashboard
		router.push('/dashboard');
	};

	const handleCloseWindow = () => {
		// Try to close the window if it was opened as a popup
		if (isClient && window.opener) {
			window.close();
		} else {
			// If not a popup, redirect to dashboard
			router.push('/dashboard');
		}
	};

	return (
		<div className="min-h-[80vh] flex items-center justify-center">
			<div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
			<Card className="w-full max-w-md">
				<CardHeader>
					<div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
						<AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
					</div>
					<CardTitle className="text-2xl font-bold text-center text-red-700 dark:text-red-400">
						{errorInfo.title}
					</CardTitle>
					<CardDescription className="text-center">
						{errorInfo.description}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground text-center">
							{errorInfo.details}
						</p>
						{reason && (
							<div className="p-3 bg-muted rounded-lg">
								<p className="text-xs font-mono text-muted-foreground">
									Error code: {reason}
								</p>
							</div>
						)}
					</div>
				</CardContent>
				<CardFooter className="flex flex-col gap-3">
					<Button onClick={handleTryAgain} className="w-full gap-2">
						<RefreshCw className="w-4 h-4" />
						Try Again
					</Button>
					<div className="flex gap-2 w-full">
						<Button
							variant="outline"
							onClick={handleCloseWindow}
							className="flex-1"
						>
							{isClient && window.opener ? "Close Window" : "Go Back"}
						</Button>
						<Link href="mailto:contact@zepid.dev" className="flex-1">
							<Button variant="outline" className="w-full gap-2">
								<Mail className="w-4 h-4" />
								Support
							</Button>
						</Link>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
