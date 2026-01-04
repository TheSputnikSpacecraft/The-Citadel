import { useState } from "react";
import { Button, TextField, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function Login() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleAuth = async () => {
        if (!username.trim() || !password.trim()) {
            setError("Please enter both username and password.");
            return;
        }
        setError("");

        const endpoint = isRegistering ? "http://localhost:8080/register" : "http://localhost:8080/login";

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Authentication failed");
            }

            console.log("Auth success:", data);

            login(data.user.username);
            navigate("/library");
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "calc(100vh - 64px)",
                padding: "20px",
            }}
        >
            <h2 style={{ fontFamily: "Cinzel, serif", color: "#e8e1d1", fontSize: "32px", marginBottom: "40px" }}>
                {isRegistering ? "Join the Citadel" : "Identify Yourself"}
            </h2>

            <Box sx={{ maxWidth: "400px", width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
                {error && (
                    <div style={{ color: "#ff6b6b", fontFamily: "Cinzel, serif", textAlign: "center" }}>
                        {error}
                    </div>
                )}

                <TextField
                    variant="outlined"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            color: "#e8e1d1",
                            fontFamily: "Cinzel, serif",
                            "& fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                            "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.5)" },
                            "&.Mui-focused fieldset": { borderColor: "#e8e1d1" },
                        },
                        "& .MuiInputBase-input": { textAlign: "center", fontSize: "18px" }
                    }}
                />

                <TextField
                    variant="outlined"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            color: "#e8e1d1",
                            fontFamily: "Cinzel, serif",
                            "& fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                            "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.5)" },
                            "&.Mui-focused fieldset": { borderColor: "#e8e1d1" },
                        },
                        "& .MuiInputBase-input": { textAlign: "center", fontSize: "18px" }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleAuth();
                    }}
                />

                <Button
                    onClick={handleAuth}
                    variant="outlined"
                    size="large"
                    sx={{
                        color: "#e8e1d1",
                        fontFamily: "Cinzel, serif",
                        fontSize: "18px",
                        padding: "12px",
                        borderColor: "rgba(255, 255, 255, 0.3)",
                        "&:hover": {
                            borderColor: "#fff",
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                        },
                    }}
                >
                    {isRegistering ? "Register" : "Enter the Citadel"}
                </Button>

                <Button
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        setError("");
                    }}
                    sx={{
                        color: "rgba(255, 255, 255, 0.5)",
                        fontFamily: "Cinzel, serif",
                        textTransform: "none",
                        "&:hover": { color: "#fff" }
                    }}
                >
                    {isRegistering ? "Already have an account? Login" : "Don't have an account? Register"}
                </Button>
            </Box>
        </Box>
    );
}
