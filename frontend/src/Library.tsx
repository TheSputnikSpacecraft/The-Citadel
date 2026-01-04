import { useNavigate } from "react-router-dom";
import { Typography, Card, CardActionArea, Grid } from "@mui/material";


const boards = [
    { name: "TheIronThrone", description: "The center of the realm. General discussion for all subjects.", color: "#FFD700" },
    { name: "GOTLore", description: "Uncover the secrets of the past. History, symbolism, and prophecy.", color: "#8a2be2" },
    { name: "FanTheories", description: "Wear your tinfoil hats. Speculation and predictions welcome.", color: "#4682b4" },
    { name: "ShowVsBooks", description: "The Ink vs The Screen. Debating changes and adaptations.", color: "#d2691e" },
    { name: "HouseStark", description: "Winter is Coming. For the wolves of the North.", color: "#d3d3d3" },
    { name: "HouseTargaryen", description: "Fire and Blood. Dragons, Valyria, and the conquest.", color: "#b22222" },
    { name: "Characters", description: "Heroes and Villains. Deep dives into specific characters.", color: "#ffa07a" },
    { name: "GOTMemes", description: "A little levity in grim times. Memes and humor.", color: "#32cd32" },
    { name: "GOTFanArt", description: "The beauty of Westeros. Art, cosplay, and creations.", color: "#ff69b4" },
    { name: "TheCitadel", description: "The Order of Maesters. Meta, rules, and announcements.", color: "#f0e68c" },
];

export default function Library() {
    const navigate = useNavigate();

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 24px" }}>
            <Typography variant="h3" sx={{
                fontFamily: "Cinzel, serif",
                color: "#e8e1d1",
                marginBottom: "40px",
                textAlign: "center",
                fontWeight: "bold",
                letterSpacing: "2px"
            }}>
                THE GRAND LIBRARY
            </Typography>

            <Grid container spacing={3}>
                {boards.map((board) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={board.name}>
                        <Card sx={{
                            backgroundColor: "rgba(28, 30, 38, 0.9)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            transition: "transform 0.2s, border-color 0.2s",
                            "&:hover": {
                                transform: "translateY(-4px)",
                                borderColor: board.color
                            }
                        }}>
                            <CardActionArea
                                onClick={() => navigate(`/boards/${encodeURIComponent(board.name)}`)}
                                sx={{ height: "100%", padding: "24px" }}
                            >
                                <Typography variant="h5" sx={{
                                    fontFamily: "Cinzel, serif",
                                    color: board.color,
                                    marginBottom: "12px",
                                    fontWeight: "bold"
                                }}>
                                    {board.name.toUpperCase()}
                                </Typography>
                                <Typography sx={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "14px", lineHeight: 1.6 }}>
                                    {board.description}
                                </Typography>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </div>
    );
}
