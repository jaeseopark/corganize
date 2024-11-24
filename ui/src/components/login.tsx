import { axios, setJwt } from "@/api";
import { useState } from "preact/hooks";

const Login = () => {
  // State to store the OTP value
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setSuccess] = useState(false);

  // Handle input change
  const handleOtpChange = (event) => {
    setOtp(event.target.value);
  };

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();

    // Basic validation to ensure OTP is entered
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    axios
      .post(
        "/api/token",
        { token: otp },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
      .then((r) => {
        setJwt(r.data.access_token);
        setSuccess(true);
      })
      .catch((error) => {
        setError(error.message || "Something went wrong");
      });
  };

  if (isSuccess) {
    return <div>You can now access other routes</div>;
  }

  return (
    <div>
      <h2>Verify Your OTP</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="otp">Enter OTP:</label>
          <input
            id="otp"
            name="otp"
            type="text"
            value={otp}
            onChange={handleOtpChange}
            autoComplete="one-time-code" // Enables autofill for OTP
            placeholder="Enter 6-digit OTP"
            maxLength="6"
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div>
          <button type="submit">Submit OTP</button>
        </div>
      </form>
    </div>
  );
};

export default Login;
