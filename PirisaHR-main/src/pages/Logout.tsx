import { useEffect } from 'react';

const Logout = () => {
    useEffect(() => {
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();

        // Check for returnTo parameter in URL (for SSO chain)
        const params = new URLSearchParams(window.location.search);
        const returnTo = params.get('returnTo');

        if (returnTo) {
            // If part of a chain, continue to next system
            window.location.href = returnTo;
        } else {
            // Standalone logout: go to the main dashboard login as requested
            window.location.href = "http://167.71.206.166:3000/login";
        }
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Logging out from PirisaHR...</p>
            </div>
        </div>
    );
};

export default Logout;
