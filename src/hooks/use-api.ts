import { useCallback } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { useFeedback } from "@/providers/FeedbackProvider";

export function useApi() {
	const { withLoading, showError } = useFeedback();

	const safeRequest = useCallback(
		async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
			return withLoading(async () => {
				try {
					return await fn();
				} catch (e) {
					const err = e as ApiError;
					let message = err?.message || "Có lỗi xảy ra khi kết nối máy chủ";
					
					// Check if there are field-specific validation errors in details
					if (err?.details && typeof err.details === 'object') {
						const details = err.details as Record<string, any>;
						
						// Check for 'detail' field (your API returns this)
						if (details.detail && typeof details.detail === 'object') {
							const fieldErrors = Object.entries(details.detail)
								.map(([field, msg]) => `${msg}`)
								.join('\n');
							if (fieldErrors) {
								message = fieldErrors;
							}
						}
						// Check for direct field errors in details
						else if (details.errors && typeof details.errors === 'object') {
							const fieldErrors = Object.entries(details.errors)
								.map(([field, msg]) => `${msg}`)
								.join('\n');
							if (fieldErrors) {
								message = fieldErrors;
							}
						}
					}
					
					showError(message);
					return undefined;
				}
			});
		},
		[withLoading, showError],
	);

	return {
		api,
		safeRequest,
	};
}
