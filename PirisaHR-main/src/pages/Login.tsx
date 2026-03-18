import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import backgroundImage from "../assets/images/loginBackground.jpg";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../components/Loading/Loading";
import { backendUrl } from "../api/config/backend";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Loading state
  const [showPassword, setShowPassword] = useState(false); // Password visibility state
  const navigate = useNavigate();
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Check for SSO token on component mount
  useEffect(() => {
    const checkSSOToken = () => {
      const ssoTokenStr = localStorage.getItem('knoweb_sso_token');
      
      if (ssoTokenStr) {
        try {
          const ssoToken = JSON.parse(ssoTokenStr);
          
          // Verify token is recent (within 5 minutes)
          const tokenAge = Date.now() - ssoToken.timestamp;
          const fiveMinutes = 5 * 60 * 1000;
          
          if (tokenAge < fiveMinutes && ssoToken.source === 'knoweb') {
            // Valid SSO token - set up session data for company user
            // Using dummy token since we're bypassing normal login
            localStorage.setItem("token", "sso_token_" + Date.now());
            localStorage.setItem("role", "CMPNY");
            localStorage.setItem("username", ssoToken.email);
            localStorage.setItem("companyName", ssoToken.companyName);
            
            // Remove SSO token after use
            localStorage.removeItem('knoweb_sso_token');
            
            toast.success(`Welcome ${ssoToken.companyName}! Logged in via KNOWEB`);
            navigate("/dashboard");
            return;
          } else {
            // Token expired or invalid
            localStorage.removeItem('knoweb_sso_token');
          }
        } catch (error) {
          console.error('Error parsing SSO token:', error);
          localStorage.removeItem('knoweb_sso_token');
        }
      }
    };
    
    checkSSOToken();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(backendUrl("/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.response.resultCode === 100) {
        console.log("DEBUG - Login successful, storing data:", data.details);
        
        // Store common user data
        localStorage.setItem("token", data.details.token);
        localStorage.setItem("role", data.details.Role);
        localStorage.setItem("username", data.details.username);

        // Role-specific ID storage
        if (data.details.Role === "CMPNY") {
          // For company users, store CMPNY_Id
          console.log("DEBUG - Storing CMPNY_Id:", data.details.CMPNY_Id);
          localStorage.setItem("cmpnyId", data.details.CMPNY_Id);
          localStorage.setItem("companyId", data.details.CMPNY_Id);
          // console.log("Company login:", {
          //   role: data.details.Role,
          //   companyId: data.details.CMPNY_Id,
          //   username: data.details.username,
          // });
          navigate("/dashboard");
        } else {
          // For employees, store EMP_id (assuming it's available in the response)
          // If the field is named differently, adjust accordingly
          console.log("DEBUG - Storing employee data:", data.details);
          localStorage.setItem(
            "empId",
            data.details.EMP_id || data.details.employeeId
          );
          localStorage.setItem("cmpnyId", data.details.CMPNY_Id);
          localStorage.setItem("companyId", data.details.CMPNY_Id);

          // console.log("Employee login:", {
          //   role: data.details.Role,
          //   employeeId: data.details.EMP_id || data.details.employeeId,
          //   username: data.details.username,
          // });
          navigate("/employee-dashboard");
        }

        toast.success("Login successful!");
      } else {
        setError(
          data.response.resultMessage ||
            "Login failed. Please check your credentials."
        );
        toast.error(
          data.response.resultMessage ||
            "Login failed. Please check your credentials."
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setError("An error occurred. Please try again later.");
      toast.error("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email address to reset your password.");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    
    setIsForgotLoading(true);

    try {
      const response = await fetch(
        backendUrl(
          `/password/forgotPassword?email=${encodeURIComponent(
          resetEmail
          )}`
        ),
        {
          method: "POST",
        }
      );

      const data = await response.json();
      
      if (data.resultCode === 100) {
        // Show success message and close modal
        toast.success(data.message || "A new password has been sent to your email address.", {
          position: "top-center",
          autoClose: 8000,
          closeOnClick: false,
          pauseOnHover: true,
        });
        setShowForgotModal(false);
        setResetEmail("");
      } else {
        // Show error message
        toast.error(data.message || "Email not found. Please check your email and try again.", {
          position: "top-center",
          autoClose: 8000,
        });
      }
    } catch {
      toast.error("An error occurred. Please try again.", {
        position: "top-center",
      });
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row h-screen bg-gray-50">
        {/* Left Side: Welcome Banner */}
        <div
          className="hidden md:flex flex-1 items-center justify-center bg-cover bg-center bg-no-repeat h-screen w-full "
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.9)), url(${backgroundImage})`,
          }}
        >
          <div className="text-center px-5 pt-24">
            <h2 className="text-6xl font-bold mb-4 text-zinc-300">
              Welcome to PirisaHR
            </h2>
            <p className="text-gray-400 text mb-2">HR Management Software</p>
          </div>
        </div>
        {/* Right Side: Login Form */}
        <div className="flex flex-col flex-1 justify-center items-center px-8 md:px-0">
          <div className="w-full max-w-md">
            <div className="flex flex-col justify-center items-center mb-6">
              {/* Logo */}
              <img src="/logo.png" alt="PirisaHR Logo" className="h-20" />
              <p className="text-gray-400 text mb-2">HR Management Software</p>
            </div>

            {/* Login Form */}
            <h1 className="text-2xl font-semibold text-gray-700 mb-4 items-center text-center">
              Login
            </h1>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-600"
                >
                  Username or Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  placeholder="Enter your username or email"
                  required
                  className="w-full mt-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-green-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can login with either your username or email address
                </p>
              </div>

              {/* Password Field with Toggle */}
              <div className="relative">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-600"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Input your account password "
                  required
                  className="w-full mt-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring focus:ring-green-200 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-600 hover:text-gray-800"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember-me"
                    className="h-4 w-4 text-green-500 focus:ring-green-400 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 text-gray-600">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-gray-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button with Loading */}
              <button
                type="submit"
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md focus:ring focus:ring-green-300 relative disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loading
                      size="xs"
                      color="border-white"
                      className="inline mr-2"
                    />
                    <span>Loging...</span>
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>
          </div>
        {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/register")}
                className="text-green-500 hover:text-green-600 font-medium"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Reset Password</h2>
            <p className="text-gray-600 mb-6">
              Enter your email address and we'll send you a new password.
            </p>
            
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="reset-email"
                  name="reset-email"
                  placeholder="Enter your email address"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-green-200 focus:border-green-500"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetEmail("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isForgotLoading}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isForgotLoading ? (
                    <>
                      <Loading
                        size="xs"
                        color="border-white"
                        className="inline mr-2"
                      />
                      Sending...
                    </>
                  ) : (
                    "Send Password"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default LoginPage;
