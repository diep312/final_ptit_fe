import React from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

interface ConferenceTopBarProps {
	title: string;
	navItems?: Array<{ label: string; to: string }>;
	actions?: React.ReactNode;
}

export const ConferenceTopBar: React.FC<ConferenceTopBarProps> = ({ title, actions }) => {
	const location = useLocation();

	return (
		<div className="sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
			<div className="max-w-8xl mx-auto px-6 py-4">
				<div className="flex items-center justify-between gap-4">
					<h1 className="text-xl md:text-4xl font-heading font-semibold">{title}</h1>
					{actions && (
						<div className="flex items-center gap-2">
							{actions}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ConferenceTopBar;
