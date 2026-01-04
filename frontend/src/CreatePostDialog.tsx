import { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useAuth } from "./context/AuthContext";

interface CreatePostDialogProps {
    open: boolean;
    onClose: () => void;
    onPostCreated: () => void;
    defaultBoard?: string;
}

export default function CreatePostDialog({ open, onClose, onPostCreated, defaultBoard }: CreatePostDialogProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [board, setBoard] = useState(defaultBoard || "TheIronThrone");
    const [link, setLink] = useState("");
    const [error, setError] = useState("");


    useEffect(() => {
        if (defaultBoard) {
            setBoard(defaultBoard);
        }
    }, [defaultBoard, open]);

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            setError("Title and Content are required.");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    content,
                    username: user?.username || "Anonymous",
                    board,
                    link
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create post");
            }

            onPostCreated();
            onClose();
            setTitle("");
            setContent("");
            setLink("");
            setError("");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to create post. Please try again.");
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{
            sx: {
                backgroundColor: "#1c1e26",
                color: "#cfc6b2",
                border: "1px solid rgba(255, 255, 255, 0.1)",
            }
        }}>
            <DialogTitle sx={{ fontFamily: "Cinzel, serif", color: "#e8e1d1" }}>Start a Discussion</DialogTitle>
            <DialogContent>
                {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}
                <TextField
                    autoFocus
                    margin="dense"
                    label="Title"
                    fullWidth
                    variant="outlined"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    sx={{
                        marginBottom: 2,
                        "& .MuiInputBase-input": { color: "#e8e1d1" },
                        "& .MuiInputLabel-root": { color: "rgba(232, 225, 209, 0.7)" },
                        "& .MuiOutlinedInput-root fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                    }}
                />

                <FormControl fullWidth sx={{ marginBottom: 2 }}>
                    <InputLabel sx={{ color: "rgba(232, 225, 209, 0.7)" }}>Topic</InputLabel>
                    <Select
                        value={board}
                        label="Topic"
                        onChange={(e) => setBoard(e.target.value)}
                        disabled={!!defaultBoard}
                        sx={{
                            color: "#e8e1d1",
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255, 255, 255, 0.2)" },
                            "& .MuiSvgIcon-root": { color: "#e8e1d1" },
                            "&.Mui-disabled": {
                                color: "rgba(232, 225, 209, 0.4)",
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255, 255, 255, 0.1)" },
                            }
                        }}
                    >
                        <MenuItem value="TheIronThrone">r/TheIronThrone</MenuItem>
                        <MenuItem value="GOTLore">r/GOTLore</MenuItem>
                        <MenuItem value="FanTheories">r/FanTheories</MenuItem>
                        <MenuItem value="ShowVsBooks">r/ShowVsBooks</MenuItem>
                        <MenuItem value="HouseStark">r/HouseStark</MenuItem>
                        <MenuItem value="HouseTargaryen">r/HouseTargaryen</MenuItem>
                        <MenuItem value="Characters">r/Characters</MenuItem>
                        <MenuItem value="GOTMemes">r/GOTMemes</MenuItem>
                        <MenuItem value="GOTFanArt">r/GOTFanArt</MenuItem>
                        <MenuItem value="TheCitadel">r/TheCitadel</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    margin="dense"
                    label="Media Link (Painting or Moving Picture URL)"
                    fullWidth
                    variant="outlined"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://... (jpg, png, gif, youtube, mp4)"
                    sx={{
                        marginBottom: 2,
                        "& .MuiInputBase-input": { color: "#e8e1d1" },
                        "& .MuiInputLabel-root": { color: "rgba(232, 225, 209, 0.7)" },
                        "& .MuiOutlinedInput-root fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                    }}
                />
                <TextField
                    margin="dense"
                    label="Content"
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    sx={{
                        "& .MuiInputBase-input": { color: "#e8e1d1" },
                        "& .MuiInputLabel-root": { color: "rgba(232, 225, 209, 0.7)" },
                        "& .MuiOutlinedInput-root fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                    }}
                />
            </DialogContent>
            <DialogActions sx={{ padding: "20px" }}>
                <Button onClick={onClose} sx={{ color: "rgba(255, 255, 255, 0.5)" }}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" sx={{ backgroundColor: "#cfc6b2", color: "#12131a", "&:hover": { backgroundColor: "#fff" } }}>
                    Publish
                </Button>
            </DialogActions>
        </Dialog>
    );
}
