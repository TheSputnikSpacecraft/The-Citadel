import { Box, Button } from "@mui/material";
import { useAuth } from "./context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    if (!user) {
        return <div style={{ color: "#e8e1d1", textAlign: "center", marginTop: "50px" }}>Access Denied</div>;
    }

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "60px",
                color: "#e8e1d1",
                fontFamily: "Cinzel, serif",
            }}
        >
            <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>Welcome, {user.username}</h1>

            <p style={{ fontSize: "1.2rem", maxWidth: "600px", textAlign: "center", marginBottom: "40px", lineHeight: "1.6" }}>
                You have entered the inner sanctum of The Citadel.
                Here, your contributions to the archives are recorded and your knowledge preserved.
            </p>

            <Button
                onClick={handleLogout}
                variant="outlined"
                size="large"
                sx={{
                    color: "#ff6b6b",
                    borderColor: "rgba(255, 107, 107, 0.5)",
                    fontFamily: "Cinzel, serif",
                    fontSize: "1.1rem",
                    padding: "10px 30px",
                    "&:hover": {
                        borderColor: "#ff6b6b",
                        backgroundColor: "rgba(255, 107, 107, 0.1)",
                    },
                }}
            >
                Logout
            </Button>
        </Box>
    );
}
