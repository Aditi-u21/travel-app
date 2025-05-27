import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LogInContext } from "../context/LogInContext/Login"; // Adjust path as needed

const Otpverification = ({ setNeedsOtpVerification }) => {
    const { verifyOtp, resendOtp, user, userInputOtp, setUserInputOtp, otpError } = useContext(LogInContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isValid = await verifyOtp(userInputOtp);
        if (isValid) {
            alert("OTP Verified Successfully!");
            setNeedsOtpVerification(true);
            navigate("/");
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "2rem auto", textAlign: "center" }}>
            <h2>OTP Verification</h2>
            <p>
                Enter the 6-digit OTP sent to your email: <b>{user?.email}</b>
            </p>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={userInputOtp}
                    onChange={(e) => setUserInputOtp(e.target.value)}
                    maxLength={6}
                    placeholder="Enter OTP"
                    required
                    style={{
                        padding: "0.5rem",
                        fontSize: "1rem",
                        width: "100%",
                        marginBottom: "1rem",
                        color: "black",
                    }}
                />
                <button
                    type="submit"
                    style={{ padding: "0.5rem 1rem", fontSize: "1rem" }}
                >
                    Verify OTP
                </button>
            </form>
            {otpError && (
                <p style={{ color: "red", marginTop: "0.5rem" }}>{otpError}</p>
            )}
            <button
                onClick={resendOtp}
                style={{
                    marginTop: "1rem",
                    fontSize: "0.9rem",
                    color: "blue",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                }}
            >
                Resend OTP
            </button>
        </div>
    );
};

export default Otpverification;