import { axios, setJwt } from "@/api";
import { Button } from "@/components/ui/button";
import { AUTHENTICATED_ROUTES } from "@/routes";
import { Box, Center, Heading, Input, VStack } from "@chakra-ui/react";
import { useState } from "preact/hooks";

const Login = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
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

  if (isAuthenticated || isSuccess) {
    return (
      <Center>
        <VStack>
          <Box>You have unlocked additional routes:</Box>
          {Object.keys(AUTHENTICATED_ROUTES).map((path) => (
            <Button>
              <a key={path} href={path}>
                {path}
              </a>
            </Button>
          ))}
        </VStack>
      </Center>
    );
  }
  return (
    <Center>
      <form onSubmit={handleSubmit}>
        <VStack>
          <Heading>Verify Your OTP</Heading>
          <Input
            id="otp"
            name="otp"
            type="text"
            value={otp}
            onChange={handleOtpChange}
            autoComplete="one-time-code" // Enables autofill for OTP
            placeholder="Enter OTP"
            maxLength="6"
          />
        </VStack>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <Button type="submit">Submit</Button>
      </form>
    </Center>
  );
};

export default Login;
