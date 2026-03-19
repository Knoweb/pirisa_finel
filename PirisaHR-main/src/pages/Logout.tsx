import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Logout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();

        // Check for returnTo parameter in URL
        const params = new URLSearchParams(location.search);
        const returnTo = params.get('returnTo');

        if (returnTo) {
            // If returnTo exists, redirect to that URL
            window.location.href = returnTo;
        } else {
            // Default fallback to login
            navigate('/login');
        }
    }, [navigate, location]);

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
