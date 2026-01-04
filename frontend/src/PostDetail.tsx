import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Box, Button, Chip, Typography, IconButton, TextField, Avatar } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from "./context/AuthContext";

interface Comment {
    id: number;
    content: string;
    author: { username: string };
    created_at: string;
    parent_id: number | null;
}

interface Post {
    id: number;
    title: string;
    content: string;
    author: { username: string };
    board: string;
    created_at: string;
    upvotes: number;
    link?: string;
    comments: Comment[];
}

export default function PostDetail() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [scroll, setScroll] = useState<Post | null>(null);
    const [userVote, setUserVote] = useState(0);
    const [loading, setLoading] = useState(true);
    const [newMark, setNewMark] = useState("");
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState("");


    const [isRewritingScroll, setIsRewritingScroll] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [amendingMarkId, setAmendingMarkId] = useState<number | null>(null);
    const [amendMarkContent, setAmendMarkContent] = useState("");

    const unfurlScroll = async () => {
        try {

            const usernameParam = user?.username ? `?username=${user.username}` : "";
            const res = await fetch(`http://localhost:8080/posts/${postId}${usernameParam}`);
            if (res.ok) {
                const data = await res.json();
                setScroll(data.post);
                setUserVote(data.user_vote);
            }
        } catch (error) {
            console.error("Failed to fetch post:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (postId) {
            unfurlScroll();
        }
    }, [postId, user]);

    const handleVote = async (value: number) => {
        if (!scroll) return;
        try {
            const res = await fetch(`http://localhost:8080/posts/${postId}/vote`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    value: value,
                    username: user?.username || "Anonymous"
                })
            });

            if (res.ok) {
                unfurlScroll();
            }
        } catch (error) {
            console.error("Vote failed:", error);
        }
    };

    const leaveMark = async (parentId: number | null = null, content: string) => {
        if (!content.trim()) return;
        try {
            const res = await fetch(`http://localhost:8080/posts/${postId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: content,
                    username: user?.username || "Anonymous",
                    parent_id: parentId
                })
            });

            if (res.ok) {
                if (parentId) {
                    setReplyingTo(null);
                    setReplyContent("");
                } else {
                    setNewMark("");
                }
                unfurlScroll();
            }
        } catch (error) {
            console.error("Comment failed:", error);
        }
    };

    const banishScrollToWall = async () => {
        if (!window.confirm("Are you sure you want to banish this scroll to the Wall (delete)?")) return;
        try {
            const res = await fetch(`http://localhost:8080/posts/${postId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: user?.username || "Anonymous" })
            });
            if (res.ok) {
                navigate(-1);
            }
        } catch (error) {
            console.error("Delete post failed:", error);
        }
    };

    const rewriteScroll = async () => {
        try {
            const res = await fetch(`http://localhost:8080/posts/${postId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editTitle,
                    content: editContent,
                    username: user?.username || "Anonymous"
                })
            });
            if (res.ok) {
                setIsRewritingScroll(false);
                unfurlScroll();
            }
        } catch (error) {
            console.error("Update post failed:", error);
        }
    };

    const eraseMark = async (commentId: number) => {
        if (!window.confirm("Erase your mark (delete comment)?")) return;
        try {
            const res = await fetch(`http://localhost:8080/comments/${commentId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: user?.username || "Anonymous" })
            });
            if (res.ok) {
                unfurlScroll();
            }
        } catch (error) {
            console.error("Delete comment failed:", error);
        }
    };

    const amendMark = async (commentId: number) => {
        try {
            const res = await fetch(`http://localhost:8080/comments/${commentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: amendMarkContent,
                    username: user?.username || "Anonymous"
                })
            });
            if (res.ok) {
                setAmendingMarkId(null);
                unfurlScroll();
            }
        } catch (error) {
            console.error("Update comment failed:", error);
        }
    };


    const buildCommentTree = (comments: Comment[]) => {
        const commentMap = new Map<number, Comment & { children: any[] }>();
        const roots: any[] = [];

        comments.forEach(c => {
            commentMap.set(c.id, { ...c, children: [] });
        });

        comments.forEach(c => {
            if (c.parent_id) {
                const parent = commentMap.get(c.parent_id);
                if (parent) {
                    parent.children.push(commentMap.get(c.id));
                }
            } else {
                const root = commentMap.get(c.id);
                if (root) roots.push(root);
            }
        });

        return roots;
    };

    const CommentNode = ({ comment, depth = 0 }: { comment: any, depth?: number }) => (
        <Box sx={{ marginBottom: 2, paddingLeft: depth * 2, borderLeft: depth > 0 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginBottom: 1 }}>
                <Avatar sx={{ width: 20, height: 20, fontSize: 10, backgroundColor: "#cfc6b2" }}>
                    {comment.author?.username[0].toUpperCase()}
                </Avatar>
                <Typography sx={{ fontSize: "12px", fontWeight: "bold", color: "#e8e1d1" }}>
                    {comment.author?.username}
                </Typography>
                <Typography sx={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                    • {new Date(comment.created_at).toLocaleDateString()}
                </Typography>
            </Box>

            <Typography sx={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", paddingLeft: "28px", marginBottom: "4px" }}>
                {amendingMarkId === comment.id ? (
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <TextField
                            fullWidth
                            size="small"
                            value={amendMarkContent}
                            onChange={(e) => setAmendMarkContent(e.target.value)}
                            sx={{ backgroundColor: "rgba(255,255,255,0.05)", "& .MuiOutlinedInput-root": { color: "#e8e1d1" } }}
                        />
                        <IconButton size="small" onClick={() => amendMark(comment.id)} sx={{ color: "#4caf50" }}>
                            <SaveIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setAmendingMarkId(null)} sx={{ color: "#f44336" }}>
                            <CancelIcon fontSize="small" />
                        </IconButton>
                    </Box>
                ) : (
                    comment.content
                )}
            </Typography>


            <Box sx={{ display: "flex", gap: 1, marginLeft: "20px" }}>
                <Button
                    size="small"
                    sx={{ color: "rgba(255,255,255,0.4)", textTransform: "none", fontSize: "12px", minWidth: 0, padding: 0 }}
                    onClick={() => {
                        if (replyingTo === comment.id) {
                            setReplyingTo(null);
                        } else {
                            setReplyingTo(comment.id);
                            setReplyContent("");
                        }
                    }}
                >
                    Reply
                </Button>

                {(user?.username || "Anonymous") === comment.author?.username && (
                    <>
                        <Button
                            size="small"
                            sx={{ color: "rgba(255,255,255,0.4)", textTransform: "none", fontSize: "12px", minWidth: 0, padding: 0 }}
                            onClick={() => {
                                setAmendingMarkId(comment.id);
                                setAmendMarkContent(comment.content);
                            }}
                        >
                            Edit
                        </Button>
                        <Button
                            size="small"
                            sx={{ color: "rgba(255,255,255,0.4)", textTransform: "none", fontSize: "12px", minWidth: 0, padding: 0, "&:hover": { color: "#ff6b6b" } }}
                            onClick={() => eraseMark(comment.id)}
                        >
                            Delete
                        </Button>
                    </>
                )}
            </Box>


            {replyingTo === comment.id && (
                <Box sx={{ display: "flex", gap: 1, marginTop: 1, marginLeft: "28px" }}>
                    <TextField
                        size="small"
                        fullWidth
                        variant="outlined"
                        placeholder="Write a reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        sx={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            "& .MuiOutlinedInput-root": { color: "#e8e1d1", fontSize: "14px", "& fieldset": { borderColor: "transparent" } }
                        }}
                    />
                    <Button
                        size="small"
                        variant="contained"
                        onClick={() => leaveMark(comment.id, replyContent)}
                        sx={{ backgroundColor: "#e8e1d1", color: "#12131a", minWidth: "60px", "&:hover": { backgroundColor: "#fff" } }}
                    >
                        Save
                    </Button>
                </Box>
            )}


            {comment.children.length > 0 && (
                <Box sx={{ marginTop: 2 }}>
                    {comment.children.map((child: any) => (
                        <CommentNode key={child.id} comment={child} depth={1} />
                    ))}
                </Box>
            )}
        </Box>
    );

    if (loading) return <div style={{ color: "#e8e1d1", padding: 20 }}>Loading...</div>;
    if (!scroll) return <div style={{ color: "#e8e1d1", padding: 20 }}>Scroll not found</div>;

    const rootComments = scroll.comments ? buildCommentTree(scroll.comments) : [];

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px", color: "#e8e1d1" }}>

            <Button
                onClick={() => navigate(-1)}
                startIcon={<ArrowBackIcon />}
                sx={{
                    color: "rgba(232, 225, 209, 0.7)",
                    marginBottom: "20px",
                    textTransform: "none",
                    "&:hover": { color: "#fff", backgroundColor: "transparent" }
                }}
            >
                Back
            </Button>


            <Box sx={{
                backgroundColor: "#1c1e26",
                borderRadius: "4px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                overflow: "hidden"
            }}>

                <Box sx={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <Chip
                        label={scroll.board}
                        size="small"
                        variant="outlined"
                        sx={{ color: "#e8e1d1", borderColor: "rgba(255, 255, 255, 0.2)", height: "24px" }}
                    />
                    <Typography sx={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)" }}>
                        Posted by u/{scroll.author?.username} • {new Date(scroll.created_at).toLocaleDateString()}
                    </Typography>
                </Box>


                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingRight: "24px" }}>
                    {isRewritingScroll ? (
                        <TextField
                            fullWidth
                            variant="outlined"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            sx={{
                                margin: "0 24px 16px",
                                "& .MuiOutlinedInput-root": {
                                    fontFamily: "Cinzel, serif",
                                    fontSize: "2rem",
                                    color: "#e8e1d1",
                                    "& fieldset": { borderColor: "rgba(255,255,255,0.2)" }
                                }
                            }}
                        />
                    ) : (
                        <Typography variant="h4" sx={{
                            fontFamily: "Cinzel, serif",
                            padding: "0 24px",
                            marginBottom: "16px",
                            fontWeight: "bold",
                            color: "#e8e1d1"
                        }}>
                            {scroll.title}
                        </Typography>
                    )}

                    {(user?.username || "Anonymous") === scroll.author?.username && !isRewritingScroll && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <IconButton onClick={() => {
                                setIsRewritingScroll(true);
                                setEditTitle(scroll.title);
                                setEditContent(scroll.content);
                            }} sx={{ color: "rgba(232, 225, 209, 0.5)", "&:hover": { color: "#fff" } }}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton onClick={banishScrollToWall} sx={{ color: "rgba(232, 225, 209, 0.5)", "&:hover": { color: "#ff6b6b" } }}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    )}

                    {isRewritingScroll && (
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <IconButton onClick={rewriteScroll} sx={{ color: "#4caf50" }}>
                                <SaveIcon />
                            </IconButton>
                            <IconButton onClick={() => setIsRewritingScroll(false)} sx={{ color: "#f44336" }}>
                                <CancelIcon />
                            </IconButton>
                        </Box>
                    )}
                </Box>


                {isRewritingScroll ? (
                    <TextField
                        fullWidth
                        multiline
                        rows={10}
                        variant="outlined"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        sx={{
                            padding: "0 24px 24px",
                            "& .MuiOutlinedInput-root": {
                                color: "rgba(255,255,255,0.9)",
                                "& fieldset": { borderColor: "rgba(255,255,255,0.2)" }
                            }
                        }}
                    />
                ) : (
                    <Typography sx={{
                        padding: "0 24px 24px",
                        fontSize: "16px",
                        lineHeight: "1.6",
                        color: "rgba(255, 255, 255, 0.9)",
                        whiteSpace: "pre-wrap"
                    }}>
                        {scroll.content}
                    </Typography>
                )}


                {scroll.link && (
                    <Box sx={{ padding: "0 24px 24px" }}>
                        {(() => {
                            const link = scroll.link.toLowerCase();

                            if (link.includes("youtube.com") || link.includes("youtu.be")) {
                                let videoId = "";
                                if (link.includes("v=")) videoId = scroll.link.split("v=")[1].split("&")[0];
                                else if (link.includes("youtu.be/")) videoId = scroll.link.split("youtu.be/")[1].split("?")[0];

                                if (videoId) {
                                    return (
                                        <Box sx={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "4px" }}>
                                            <iframe
                                                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                                                src={`https://www.youtube.com/embed/${videoId}`}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </Box>
                                    );
                                }
                            }


                            if (link.match(/\.(jpeg|jpg|gif|png|webp|avif)$/) !== null) {
                                return (
                                    <Box component="img" src={scroll.link} sx={{ maxWidth: "100%", height: "auto", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)" }} />
                                );
                            }


                            if (link.match(/\.(mp4|webm|ogg)$/) !== null) {
                                return (
                                    <Box component="video" src={scroll.link} controls sx={{ maxWidth: "100%", height: "auto", borderRadius: "4px" }} />
                                );
                            }


                            return null;
                        })()}
                    </Box>
                )}


                <Box sx={{
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                    padding: "8px 16px",
                    display: "flex",
                    gap: "8px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.05)"
                }}>
                    <Box sx={{ display: "flex", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "20px" }}>
                        <IconButton
                            size="small"
                            onClick={() => handleVote(1)}
                            sx={{ color: userVote === 1 ? "#ff4500" : "rgba(255,255,255,0.7)", "&:hover": { color: "#ff4500" } }}
                        >
                            <ArrowUpwardIcon fontSize="small" />
                        </IconButton>

                        <span style={{ fontSize: "14px", fontWeight: "bold", padding: "0 4px", color: userVote === 1 ? "#ff4500" : (userVote === -1 ? "#7193ff" : "#fff") }}>
                            {scroll.upvotes}
                        </span>

                        <IconButton
                            size="small"
                            onClick={() => handleVote(-1)}
                            sx={{ color: userVote === -1 ? "#7193ff" : "rgba(255,255,255,0.7)", "&:hover": { color: "#7193ff" } }}
                        >
                            <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    <Button
                        startIcon={<ChatBubbleOutlineIcon />}
                        sx={{
                            color: "rgba(255,255,255,0.7)",
                            textTransform: "none",
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderRadius: "20px",
                            padding: "4px 12px"
                        }}
                    >
                        {scroll.comments?.length || 0} Marks
                    </Button>
                </Box>
            </Box>


            <Box sx={{ marginTop: "24px", padding: "0 12px" }}>

                <Box sx={{ display: "flex", gap: 2, marginBottom: 4 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="What are your thoughts?"
                        value={newMark}
                        onChange={(e) => setNewMark(e.target.value)}
                        sx={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            "& .MuiOutlinedInput-root": { color: "#e8e1d1", "& fieldset": { borderColor: "transparent" } }
                        }}
                    />
                    <Button
                        variant="contained"
                        onClick={() => leaveMark(null, newMark)}
                        sx={{ backgroundColor: "#e8e1d1", color: "#12131a", "&:hover": { backgroundColor: "#fff" } }}
                    >
                        Leave Mark
                    </Button>
                </Box>


                {rootComments.map((comment: any) => (
                    <CommentNode key={comment.id} comment={comment} />
                ))}
            </Box>
        </div>
    );
}
