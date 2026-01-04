import { Routes, Route } from "react-router-dom";
import Archives from "./Archives";
import Login from "./Login";
import Profile from "./Profile";
import PostDetail from "./PostDetail";
import Library from "./Library";
import { Button, IconButton } from "@mui/material";
import { Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <header className="topbar">
        <div className="topbarLeft">
          <Link to="/" className="topbarTitle">
            THE CITADEL
          </Link>
        </div>

        <div className="topbarRight">
          <Button
            component={Link}
            to="/library"
            sx={{
              fontFamily: "Cinzel, serif",
              fontSize: "16px",
              color: "#cfc6b2",
              borderColor: "rgba(255, 255, 255, 0.2)",
              "&:hover": {
                color: "#fff",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderColor: "rgba(255, 255, 255, 0.6)"
              }
            }}
            variant="outlined"
          >
            Library
          </Button>

          {user ? (
            <IconButton
              component={Link}
              to="/profile"
              sx={{
                color: "#cfc6b2",
                "&:hover": { color: "#fff" }
              }}
            >
              <AccountCircleIcon fontSize="large" />
            </IconButton>
          ) : (
            <Button
              component={Link}
              to="/login"
              sx={{
                fontFamily: "Cinzel, serif",
                fontSize: "16px",
                color: "#cfc6b2",
                borderColor: "rgba(255, 255, 255, 0.2)",
                "&:hover": {
                  color: "#fff",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderColor: "rgba(255, 255, 255, 0.6)"
                }
              }}
              variant="outlined"
            >
              Login
            </Button>
          )}
        </div>
      </header>


      <main className="page">
        <Routes>
          <Route
            path="/"
            element={
              <section className="quoteSection">
                <p className="quoteText">
                  A mind needs books like a sword needs a whetstone.
                </p>
                <p className="quoteAttribution">— Tyrion Lannister</p>

                <p className="landingDesc">
                  Knowledge does not vanish weary traveller, it persists.
                  <br />
                  Enter the archives where forgotten words,
                  hidden truths, and dangerous ideas are preserved for those who dare to seek them.
                </p>
                <Button
                  component={Link}
                  to="/library"
                  variant="outlined"
                  size="medium"
                  className="enterBtnMui"
                >
                  Enter the Archives
                </Button>

              </section>
            }
          />

          <Route path="/library" element={<Library />} />
          <Route path="/boards/:board" element={<Archives />} />
          <Route path="/archives" element={<Archives />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/posts/:postId" element={<PostDetail />} />
        </Routes>
      </main>
    </>
  );
}
