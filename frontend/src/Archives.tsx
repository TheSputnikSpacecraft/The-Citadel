import { Card, CardActionArea, CardContent, Chip, Button, Box, Typography, IconButton } from "@mui/material";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import CreatePostDialog from "./CreatePostDialog";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from "./context/AuthContext";

interface Post {
  id: number;
  title: string;
  author: { username: string };
  board: string;
  upvotes: number;
  replies: number;
  comments?: any[];
}

export default function Archives() {
  const navigate = useNavigate();
  const { board } = useParams();
  const { user } = useAuth();
  const [scrolls, setScrolls] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [createPostOpen, setCreatePostOpen] = useState(false);


  useEffect(() => {
    const gatherArchives = async () => {
      try {
        let url = "http://localhost:8080/posts";
        if (board) {
          url += `?board=${encodeURIComponent(board)}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setScrolls(data);
        }
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };

    gatherArchives();
  }, [board]);

  const banishScroll = async (e: React.MouseEvent, postId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Banish this scroll (delete)?")) return;
    try {
      const res = await fetch(`http://localhost:8080/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user?.username || "Anonymous" })
      });
      if (res.ok) {
        setScrolls(scrolls.filter(p => p.id !== postId));
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "30px" }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/library")}
          sx={{ color: "#e8e1d1", marginRight: "20px" }}
        >
          Library
        </Button>
        <Typography variant="h4" sx={{ fontFamily: "Cinzel, serif", color: "#e8e1d1", flexGrow: 1 }}>
          {board ? board.toUpperCase() : "ARCHIVES"}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => setCreatePostOpen(true)}
          sx={{
            fontFamily: "Cinzel, serif",
            color: "#fff",
            backgroundColor: "rgba(207, 198, 178, 0.15)",
            borderColor: "#cfc6b2",
            "&:hover": {
              backgroundColor: "rgba(207, 198, 178, 0.3)",
              borderColor: "#fff"
            }
          }}
        >
          New Scroll
        </Button>
      </div>

      <CreatePostDialog
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onPostCreated={() => window.location.reload()}
        defaultBoard={board}
      />



      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
        {scrolls.map((d) => (
          <Card
            key={d.id}
            sx={{
              backgroundColor: "rgba(28, 30, 38, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "4px"
            }}
          >
            <CardActionArea component={Link} to={`/posts/${d.id}`}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "18px", marginBottom: "6px", color: "#e8e1d1", fontWeight: "bold" }}>
                    {d.title}
                  </div>
                  {(user?.username || "Anonymous") === d.author?.username && (
                    <IconButton
                      size="small"
                      onClick={(e) => banishScroll(e, d.id)}
                      sx={{ color: "rgba(232, 225, 209, 0.5)", "&:hover": { color: "#ff6b6b" } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <div style={{ fontSize: "13px", color: "rgba(232,225,209,0.7)" }}>
                  Posted by {d.author?.username || "Unknown"} • {d.comments?.length || 0} marks
                </div>
                <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center" }}>

                  <Chip
                    label={d.board}
                    size="small"
                    sx={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      color: "#cfc6b2",
                      border: "1px solid rgba(255,255,255,0.1)"
                    }}
                    variant="outlined"
                  />
                  <Typography sx={{ fontSize: "12px", color: "#ff4500", fontWeight: "bold" }}>
                    {d.upvotes} pts
                  </Typography>
                </div>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
        {scrolls.length === 0 && !loading && (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", padding: "40px" }}>
            No scrolls found in this section. Be the first to write one.
          </div>
        )}
      </div>
    </div>
  );
}
