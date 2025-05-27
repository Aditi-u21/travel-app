/*
import { createContext, useEffect, useState, useContext } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import emailjs from "emailjs-com";

export const LogInContext = createContext(null);

export const LogInContextProvider = ({ children }) => {
    const { user, isAuthenticated, loginWithPopup, logout, getAccessTokenSilently } = useAuth0();
    const [trip, setTrip] = useState([]);
    const [trustScore, setTrustScore] = useState(0);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loginData, setLoginData] = useState({
        frequency: 0,
        ipConsistency: 1,
        sessionDuration: 0,
        lastLogin: null,
    });

    // Gather user data for trust scoring 
    const gatherUserData = () => {
        return {
            engagement: trip.length,
            feedback: 5,
            login_history: user ? 1 : 0,
        };
    };

    // Combined trust score calculation
    const calculateCombinedTrustScore = () => {
        // Code trust score components
        const userData = gatherUserData();
        const engagementScore = userData.engagement * 0.2; // Weight for engagement
        const feedbackScore = userData.feedback * 0.1; // Weight for feedback
        const loginHistoryScore = userData.login_history * 0.2; // Weight for login history

        // Code trust score components
        const now = new Date();
        const freq = loginData.frequency;
        const ip = loginData.ipConsistency;
        const duration = loginData.sessionDuration / 60; // Normalize to hours
        const sessionScore = (0.3 * freq) + (0.4 * ip) + (0.3 * duration);

        // Combine scores (normalize to 0-1)
        const combinedScore = (engagementScore + feedbackScore + loginHistoryScore + sessionScore) / 2;
        return Math.min(Math.max(combinedScore, 0), 1);
    };

    // Send welcome email
    const sendWelcomeEmail = async (email) => {
        const templateParams = {
            name: user.name || "New User",
            email: email,
        };

        try {
            await emailjs.send(
                "service_oepq08e",
                "template_n1wj4u4",
                templateParams,
                "ej7jjYM4deFARaWnU"
            );
            console.log('Welcome email sent successfully');
        } catch (error) {
            console.error('Error sending welcome email:', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            // Update login data (from code2)
            const now = new Date();
            const lastLogin = loginData.lastLogin ? new Date(loginData.lastLogin) : null;
            const freq = lastLogin && (now - lastLogin < 24 * 60 * 60 * 1000) ? loginData.frequency + 1 : 1;
            const ip = "127.0.0.1"; // Placeholder: Replace with actual IP check
            const prevIp = localStorage.getItem("lastIp") || "0.0.0.0";
            const ipConsistency = ip === prevIp ? 1 : 0;
            localStorage.setItem("lastIp", ip);

            const duration = Math.floor((now - (lastLogin || now)) / (1000 * 60));
            setLoginData({
                frequency: freq,
                ipConsistency,
                sessionDuration: duration,
                lastLogin: now.toISOString(),
            });
            setLoggedIn(true);

            // Calculate and set combined trust score
            const score = calculateCombinedTrustScore();
            setTrustScore(score);

            // Trigger re-auth if trust score is low
            if (score < 0.5) {
                loginWithPopup({ prompt: "login", screen_hint: "login" });
            }

            // Send welcome email if not sent
            const emailSent = localStorage.getItem(`welcomeEmailSent_${user.email}`);
            if (!emailSent) {
                sendWelcomeEmail(user.email);
                localStorage.setItem(`welcomeEmailSent_${user.email}`, 'true');
            }
        }
    }, [user, isAuthenticated, trip, loginWithPopup]);

    return (
        <LogInContext.Provider value={{
            user,
            isAuthenticated,
            loginWithPopup,
            logout,
            getAccessTokenSilently,
            trip,
            setTrip,
            trustScore,
            loggedIn
        }}>
            {children}
        </LogInContext.Provider>
    );
};

export const useLogInContext = () => useContext(LogInContext);
*/


/*
import { createContext, useEffect, useState, useContext } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import emailjs from "emailjs-com";

export const LogInContext = createContext(null);

export const LogInContextProvider = ({ children }) => {
    const { user, isAuthenticated, loginWithPopup, logout, getAccessTokenSilently } = useAuth0();
    const [trip, setTrip] = useState([]);
    const [trustScore, setTrustScore] = useState(0);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loginData, setLoginData] = useState({
        frequency: 0,
        ipConsistency: 1,
        sessionDuration: 0,
        lastLogin: null,
    });
    const [otp, setOtp] = useState("");
    const [userInputOtp, setUserInputOtp] = useState("");
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [showOtpPrompt, setShowOtpPrompt] = useState(false);
    const [otpResendCount, setOtpResendCount] = useState(0);
    const [lastOtpSent, setLastOtpSent] = useState(null);
    const [otpError, setOtpError] = useState("");

    // Generate a 6-digit OTP
    const generateOtp = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    // Store OTP via backend API
    const storeOtp = async (email, otp) => {
        try {
            const response = await fetch('http://localhost:3001/api/store-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            if (!response.ok) throw new Error('Failed to store OTP');
            console.log(`OTP stored for ${email}`);
            return true;
        } catch (error) {
            console.error('Error storing OTP:', error);
            setOtpError("Failed to store OTP. Please try again.");
            return false;
        }
    };

    // Validate OTP via backend API
    const validateOtp = async (email, inputOtp) => {
        try {
            const response = await fetch('http://localhost:3001/api/validate-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: inputOtp }),
            });
            if (response.ok) {
                const result = await response.text();
                if (result === 'OTP valid') {
                    return true;
                } else {
                    setOtpError("Invalid or expired OTP. Please try again.");
                    return false;
                }
            } else {
                setOtpError("Invalid or expired OTP. Please try again.");
                return false;
            }
        } catch (error) {
            console.error('Error validating OTP:', error);
            setOtpError("Failed to validate OTP. Please try again.");
            return false;
        }
    };

    // Send OTP email
    const sendOtpEmail = async (email, otp) => {
        const templateParams = {
            name: user.name || "User",
            email: email,
            otp: otp,
        };

        try {
            await emailjs.send(
                "service_43ipbek",
                "template_dwaluvr",
                templateParams,
                "N4GLBfR4WYWTRq-6_"
            );
            console.log(`OTP email sent successfully to ${email} with OTP: ${otp}`);
            const stored = await storeOtp(email, otp);
            if (stored) {
                setLastOtpSent(new Date().getTime());
                setOtpError("");
                return true;
            } else {
                setOtpError("Failed to store OTP. Please try again.");
                return false;
            }
        } catch (error) {
            console.error('Error sending OTP email:', error);
            setOtpError("Failed to send OTP email. Please try again.");
            return false;
        }
    };

    // Handle OTP resend with rate-limiting
    const handleResendOtp = async () => {
        const now = new Date().getTime();
        if (otpResendCount >= 3) {
            setOtpError("Maximum OTP resend attempts reached. Please try again later.");
            return;
        }
        if (lastOtpSent && now - lastOtpSent < 60 * 1000) {
            setOtpError("Please wait 60 seconds before requesting a new OTP.");
            return;
        }
        const newOtp = generateOtp();
        setOtp(newOtp);
        setOtpResendCount(otpResendCount + 1);
        const sent = await sendOtpEmail(user.email, newOtp);
        if (sent) {
            setUserInputOtp("");
            setOtpError("New OTP sent. Check your email.");
        }
    };

    // Verify OTP
    const verifyOtp = async () => {
        if (await validateOtp(user.email, userInputOtp)) {
            setIsOtpVerified(true);
            setShowOtpPrompt(false);
            setLoggedIn(true);
            localStorage.setItem(`otpVerified_${user.email}`, 'true');
            setOtpError("");
        } else {
            setUserInputOtp("");
        }
    };

    // Gather user data for trust scoring 
    const gatherUserData = () => {
        return {
            engagement: trip.length,
            feedback: 5,
            login_history: user ? 1 : 0,
        };
    };

    // Combined trust score calculation
    const calculateCombinedTrustScore = () => {
        const userData = gatherUserData();
        const engagementScore = userData.engagement * 0.2;
        const feedbackScore = userData.feedback * 0.1;
        const loginHistoryScore = userData.login_history * 0.2;

        const now = new Date();
        const freq = loginData.frequency;
        const ip = loginData.ipConsistency;
        const duration = loginData.sessionDuration / 60;
        const sessionScore = (0.3 * freq) + (0.4 * ip) + (0.3 * duration);

        const combinedScore = (engagementScore + feedbackScore + loginHistoryScore + sessionScore) / 2;
        return Math.min(Math.max(combinedScore, 0), 1);
    };

    // Send welcome email
    const sendWelcomeEmail = async (email) => {
        const templateParams = {
            name: user.name || "New User",
            email: email,
        };

        try {
            await emailjs.send(
                "service_oepq08e",
                "template_n1wj4u4",
                templateParams,
                "ej7jjYM4deFARaWnU"
            );
            console.log('Welcome email sent successfully');
        } catch (error) {
            console.error('Error sending welcome email:', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user && !isOtpVerified) {
            // Update login data
            const now = new Date();
            const lastLogin = loginData.lastLogin ? new Date(loginData.lastLogin) : null;
            const freq = lastLogin && (now - lastLogin < 24 * 60 * 60 * 1000) ? loginData.frequency + 1 : 1;
            const ip = "127.0.0.1"; // Placeholder: Replace with actual IP check
            const prevIp = localStorage.getItem("lastIp") || "0.0.0.0";
            const ipConsistency = ip === prevIp ? 1 : 0;
            localStorage.setItem("lastIp", ip);

            const duration = Math.floor((now - (lastLogin || now)) / (1000 * 60));
            setLoginData({
                frequency: freq,
                ipConsistency,
                sessionDuration: duration,
                lastLogin: now.toISOString(),
            });

            // Calculate trust score
            const score = calculateCombinedTrustScore();
            setTrustScore(score);

            // Check if OTP is needed
            const otpVerified = localStorage.getItem(`otpVerified_${user.email}`);
            const isFirstLogin = !localStorage.getItem(`welcomeEmailSent_${user.email}`);
            if (score < 0.5 || isFirstLogin || !otpVerified) {
                const newOtp = generateOtp();
                setOtp(newOtp);
                setShowOtpPrompt(true);
                sendOtpEmail(user.email, newOtp);
            } else {
                setIsOtpVerified(true);
                setLoggedIn(true);
            }

            // Send welcome email if not sent
            const emailSent = localStorage.getItem(`welcomeEmailSent_${user.email}`);
            if (!emailSent) {
                sendWelcomeEmail(user.email);
                localStorage.setItem(`welcomeEmailSent_${user.email}`, 'true');
            }
        }
    }, [user, isAuthenticated, trip]);

    return (
        <LogInContext.Provider value={{
            user,
            isAuthenticated,
            loginWithPopup,
            logout,
            getAccessTokenSilently,
            trip,
            setTrip,
            trustScore,
            loggedIn,
            isOtpVerified,
        }}>
            {showOtpPrompt && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-60 z-50">
                    <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Two-Factor Authentication</h2>
                        <p className="text-gray-600 mb-4">
                            Enter the 6-digit OTP sent to {user.email}.
                            {otpError ? (
                                <span className="text-red-500 block mt-2">{otpError}</span>
                            ) : (
                                <span className="block mt-2">Check your email (including spam/junk).</span>
                            )}
                        </p>
                        <input
                            type="text"
                            value={userInputOtp}
                            onChange={(e) => setUserInputOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            className="border border-gray-300 p-3 mb-4 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            maxLength={6}
                        />
                        <div className="flex justify-between gap-4">
                            <button
                                onClick={verifyOtp}
                                className="bg-blue-600 text-white p-3 rounded-md w-full hover:bg-blue-700 transition"
                            >
                                Verify OTP
                            </button>
                            <button
                                onClick={handleResendOtp}
                                className="bg-gray-200 text-gray-800 p-3 rounded-md w-full hover:bg-gray-300 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                                disabled={otpResendCount >= 3 || (lastOtpSent && new Date().getTime() - lastOtpSent < 60 * 1000)}
                            >
                                Resend OTP
                            </button>
                        </div>
                        {otpResendCount >= 3 && (
                            <p className="text-red-500 text-sm mt-4">Maximum resend attempts reached. Please try again later.</p>
                        )}
                    </div>
                </div>
            )}
            {children}
        </LogInContext.Provider>
    );
};

export const useLogInContext = () => useContext(LogInContext);

*/


import { createContext, useEffect, useState, useContext } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import emailjs from "emailjs-com";

export const LogInContext = createContext(null);

export const LogInContextProvider = ({ children }) => {
    const { user, isAuthenticated, loginWithPopup, logout, getAccessTokenSilently } = useAuth0();
    const [trip, setTrip] = useState([]);
    const [trustScore, setTrustScore] = useState(0);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loginData, setLoginData] = useState({
        frequency: 0,
        ipConsistency: 1,
        sessionDuration: 0,
        lastLogin: null,
    });
    const [generatedOtp, setGeneratedOtp] = useState(null);
    const [userInputOtp, setUserInputOtp] = useState("");
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [showOtpPrompt, setShowOtpPrompt] = useState(false);
    const [otpResendCount, setOtpResendCount] = useState(0);
    const [lastOtpSent, setLastOtpSent] = useState(null);
    const [otpError, setOtpError] = useState("");

    // Generate a 6-digit OTP (from code2)
    const generateOtp = () => {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        return otp;
    };

    // Store OTP via backend API (unchanged from code1)
    const storeOtp = async (email, otp) => {
        try {
            const response = await fetch('http://localhost:3001/api/store-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            if (!response.ok) throw new Error('Failed to store OTP');
            console.log(`OTP stored for ${email}`);
            return true;
        } catch (error) {
            console.error('Error storing OTP:', error);
            setOtpError("");
            return false;
        }
    };

    // Verify OTP (adapted from code2 to compare locally)
    const verifyOtp = async (enteredOtp) => {
        if (enteredOtp === generatedOtp) {
            setIsOtpVerified(true);
            setShowOtpPrompt(false);
            setLoggedIn(true);
            localStorage.setItem(`otpVerified_${user.email}`, 'true');
            setOtpError("");
            return true;
        } else {
            setOtpError("Invalid OTP. Please try again.");
            setUserInputOtp("");
            return false;
        }
    };

    // Send OTP email (adapted to use code2's templateParams structure)
    const sendOtpEmail = async (email, otp) => {
        const templateParams = {
            name: user.name || "User",
            email: email,
            code: otp, // Changed from 'otp' to 'code' to match code2
        };

        try {
            await emailjs.send(
                "service_43ipbek",
                "template_dwaluvr",
                templateParams,
                "N4GLBfR4WYWTRq-6_"
            );
            console.log(`OTP email sent successfully to ${email} with OTP: ${otp}`);
            const stored = await storeOtp(email, otp);
            if (stored) {
                setLastOtpSent(new Date().getTime());
                setOtpError("");
                return true;
            } else {
                setOtpError("Failed to store OTP. Please try again.");
                return false;
            }
        } catch (error) {
            console.error('Error sending OTP email:', error);
            setOtpError("Failed to send OTP email. Please try again.");
            return false;
        }
    };

    // Handle OTP resend with rate-limiting (adapted to use generateOtp from code2)
    const handleResendOtp = async () => {
        const now = new Date().getTime();
        if (otpResendCount >= 3) {
            setOtpError("Maximum OTP resend attempts reached. Please try again later.");
            return;
        }
        if (lastOtpSent && now - lastOtpSent < 60 * 1000) {
            setOtpError("Please wait 60 seconds before requesting a new OTP.");
            return;
        }
        const newOtp = generateOtp();
        setOtpResendCount(otpResendCount + 1);
        const sent = await sendOtpEmail(user.email, newOtp);
        if (sent) {
            setUserInputOtp("");
            setOtpError("New OTP sent. Check your email.");
        }
    };

    // Gather user data for trust scoring (unchanged from code1)
    const gatherUserData = () => {
        return {
            engagement: trip.length,
            feedback: 5,
            login_history: user ? 1 : 0,
        };
    };

    // Combined trust score calculation (unchanged from code1)
    const calculateCombinedTrustScore = () => {
        const userData = gatherUserData();
        const engagementScore = userData.engagement * 0.2;
        const feedbackScore = userData.feedback * 0.1;
        const loginHistoryScore = userData.login_history * 0.2;

        const now = new Date();
        const freq = loginData.frequency;
        const ip = loginData.ipConsistency;
        const duration = loginData.sessionDuration / 60;
        const sessionScore = (0.3 * freq) + (0.4 * ip) + (0.3 * duration);

        const combinedScore = (engagementScore + feedbackScore + loginHistoryScore + sessionScore) / 2;
        return Math.min(Math.max(combinedScore, 0), 1);
    };

    // Send welcome email (unchanged from code1)
    const sendWelcomeEmail = async (email) => {
        const templateParams = {
            name: user.name || "New User",
            email: email,
        };

        try {
            await emailjs.send(
                "service_oepq08e",
                "template_n1wj4u4",
                templateParams,
                "ej7jjYM4deFARaWnU"
            );
            console.log('Welcome email sent successfully');
        } catch (error) {
            console.error('Error sending welcome email:', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated && user && !isOtpVerified) {
            // Update login data
            const now = new Date();
            const lastLogin = loginData.lastLogin ? new Date(loginData.lastLogin) : null;
            const freq = lastLogin && (now - lastLogin < 24 * 60 * 60 * 1000) ? loginData.frequency + 1 : 1;
            const ip = "127.0.0.1"; // Placeholder: Replace with actual IP check
            const prevIp = localStorage.getItem("lastIp") || "0.0.0.0";
            const ipConsistency = ip === prevIp ? 1 : 0;
            localStorage.setItem("lastIp", ip);

            const duration = Math.floor((now - (lastLogin || now)) / (1000 * 60));
            setLoginData({
                frequency: freq,
                ipConsistency,
                sessionDuration: duration,
                lastLogin: now.toISOString(),
            });

            // Calculate trust score
            const score = calculateCombinedTrustScore();
            setTrustScore(score);

            // Check if OTP is needed
            const otpVerified = localStorage.getItem(`otpVerified_${user.email}`);
            const isFirstLogin = !localStorage.getItem(`welcomeEmailSent_${user.email}`);
            if (score < 0.5 || isFirstLogin || !otpVerified) {
                const newOtp = generateOtp();
                setShowOtpPrompt(true);
                sendOtpEmail(user.email, newOtp);
            } else {
                setIsOtpVerified(true);
                setLoggedIn(true);
            }

            // Send welcome email if not sent
            const emailSent = localStorage.getItem(`welcomeEmailSent_${user.email}`);
            if (!emailSent) {
                sendWelcomeEmail(user.email);
                localStorage.setItem(`welcomeEmailSent_${user.email}`, 'true');
            }
        }
    }, [user, isAuthenticated, trip]);

    return (
        <LogInContext.Provider value={{
            user,
            isAuthenticated,
            loginWithPopup,
            logout,
            getAccessTokenSilently,
            trip,
            setTrip,
            trustScore,
            loggedIn,
            isOtpVerified,
        }}>
            {showOtpPrompt && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-60 z-50">
                    <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Two-Factor Authentication</h2>
                        <p className="text-gray-600 mb-4">
                            Enter the 6-digit OTP sent to {user.email}.
                            {otpError ? (
                                <span className="text-red-500 block mt-2">{otpError}</span>
                            ) : (
                                <span className="block mt-2">Check your email (including spam/junk).</span>
                            )}
                        </p>
                        <input
                            type="text"
                            value={userInputOtp}
                            onChange={(e) => setUserInputOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                            className="border border-gray-300 p-3 mb-4 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            maxLength={6}
                        />
                        <div className="flex justify-between gap-4">
                            <button
                                onClick={() => verifyOtp(userInputOtp)}
                                className="bg-blue-600 text-white p-3 rounded-md w-full hover:bg-blue-700 transition"
                            >
                                Verify OTP
                            </button>
                            <button
                                onClick={handleResendOtp}
                                className="bg-gray-200 text-gray-800 p-3 rounded-md w-full hover:bg-gray-300 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                                disabled={otpResendCount >= 3 || (lastOtpSent && new Date().getTime() - lastOtpSent < 60 * 1000)}
                            >
                                Resend OTP
                            </button>
                        </div>
                        {otpResendCount >= 3 && (
                            <p className="text-red-500 text-sm mt-4">Maximum resend attempts reached. Please try again later.</p>
                        )}
                    </div>
                </div>
            )}
            {children}
        </LogInContext.Provider>
    );
};

export const useLogInContext = () => useContext(LogInContext);