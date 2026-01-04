package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	ID       uint      `json:"id" gorm:"primaryKey"`
	Username string    `json:"username" gorm:"unique"`
	Password string    `json:"-"`
	Posts    []Post    `json:"posts,omitempty" gorm:"foreignKey:AuthorID"`
	Comments []Comment `json:"comments,omitempty" gorm:"foreignKey:AuthorID"`
	Votes    []Vote    `json:"votes,omitempty" gorm:"foreignKey:UserID"`
}

type Vote struct {
	ID     uint `json:"id" gorm:"primaryKey"`
	UserID uint `json:"user_id" gorm:"uniqueIndex:idx_user_post"`
	PostID uint `json:"post_id" gorm:"uniqueIndex:idx_user_post"`
	Value  int  `json:"value"`
}

type Post struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Board     string    `json:"board"`
	Link      string    `json:"link"`
	Upvotes   int       `json:"upvotes"`
	AuthorID  uint      `json:"author_id"`
	Author    User      `json:"author" gorm:"foreignKey:AuthorID"`
	Comments  []Comment `json:"comments,omitempty" gorm:"foreignKey:PostID"`
	CreatedAt time.Time `json:"created_at"`
}

type Comment struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Content   string    `json:"content"`
	PostID    uint      `json:"post_id"`
	ParentID  *uint     `json:"parent_id"`
	AuthorID  uint      `json:"author_id"`
	Author    User      `json:"author" gorm:"foreignKey:AuthorID"`
	CreatedAt time.Time `json:"created_at"`
}

type RegisterInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

var DB *gorm.DB

func main() {

	var err error
	DB, err = gorm.Open(sqlite.Open("citadel.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	err = DB.AutoMigrate(&User{}, &Post{}, &Comment{}, &Vote{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	r.POST("/register", Register)
	r.POST("/login", Login)

	r.GET("/posts", RetrieveScrolls)
	r.GET("/posts/:id", RetrieveScroll)
	r.POST("/posts", ScribeNewScroll)
	r.POST("/posts/:id/vote", CastVote)
	r.POST("/posts/:id/comments", LeaveMark)

	r.PUT("/posts/:id", RewriteScroll)
	r.DELETE("/posts/:id", BurnScroll)

	r.PUT("/comments/:id", AmendMark)
	r.DELETE("/comments/:id", EraseMark)

	log.Println("Server starting on :8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}

func Register(c *gin.Context) {
	var input RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existingUser User
	if err := DB.Where("username = ?", input.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already taken"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := User{
		Username: input.Username,
		Password: string(hashedPassword),
	}
	if err := DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User created successfully", "user": user})
}

func Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user User
	if err := DB.Where("username = ?", input.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Login successful", "user": user})
}

type CreatePostInput struct {
	Title    string `json:"title" binding:"required"`
	Content  string `json:"content" binding:"required"`
	Username string `json:"username"`
	Board    string `json:"board"`
	Link     string `json:"link"`
}

func ScribeNewScroll(c *gin.Context) {
	var input CreatePostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("DEBUG: CreatePost called. Title: %s, Board: %s, User: '%s'\n", input.Title, input.Board, input.Username)

	var author User
	targetUsername := input.Username
	if targetUsername == "" || targetUsername == "Anonymous" {
		targetUsername = "Anonymous"
	}

	if err := DB.Where("username = ?", targetUsername).First(&author).Error; err != nil {
		log.Printf("DEBUG: User '%s' not found. Falling back to Anonymous.\n", targetUsername)
		targetUsername = "Anonymous"
		if err := DB.Where("username = ?", "Anonymous").First(&author).Error; err != nil {
			hashed, _ := bcrypt.GenerateFromPassword([]byte("anon_secret_key"), bcrypt.DefaultCost)
			author = User{Username: "Anonymous", Password: string(hashed)}
			DB.Create(&author)
		}
	}

	scroll := Post{
		Title:    input.Title,
		Content:  input.Content,
		Board:    input.Board,
		Link:     input.Link,
		AuthorID: author.ID,
		Author:   author,
	}

	if scroll.Board == "" {
		scroll.Board = "General"
	}

	if err := DB.Create(&scroll).Error; err != nil {
		log.Println("DEBUG: Failed to create post in DB:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
		return
	}

	log.Println("DEBUG: Scroll scribed successfully. ID:", scroll.ID)
	c.JSON(http.StatusCreated, scroll)
}

func RetrieveScrolls(c *gin.Context) {
	var scrolls []Post
	query := DB.Preload("Author").Order("created_at desc")

	board := c.Query("board")
	log.Printf("DEBUG: RetrieveScrolls called. Board Filter: '%s'\n", board)

	if board != "" {
		query = query.Where("board COLLATE NOCASE = ?", board)
	}

	if err := query.Find(&scrolls).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch scrolls"})
		return
	}
	log.Printf("DEBUG: Found %d scrolls\n", len(scrolls))
	c.JSON(http.StatusOK, scrolls)
}

func RetrieveScroll(c *gin.Context) {
	var scroll Post
	id := c.Param("id")

	if err := DB.Preload("Author").Preload("Comments.Author").First(&scroll, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Scroll not found"})
		return
	}

	username := c.Query("username")
	userVote := 0
	if username != "" {
		var user User
		if err := DB.Where("username = ?", username).First(&user).Error; err == nil {
			var vote Vote
			if err := DB.Where("user_id = ? AND post_id = ?", user.ID, scroll.ID).First(&vote).Error; err == nil {
				userVote = vote.Value
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"post":      scroll,
		"user_vote": userVote,
	})
}

type VoteInput struct {
	Value    int    `json:"value" binding:"required"`
	Username string `json:"username"`
}

func CastVote(c *gin.Context) {
	id := c.Param("id")
	var input VoteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user User
	targetUsername := input.Username
	if targetUsername == "" {
		targetUsername = "Anonymous"
	}

	if err := DB.Where("username = ?", targetUsername).First(&user).Error; err != nil {
		if targetUsername == "Anonymous" {
			hashed, _ := bcrypt.GenerateFromPassword([]byte("anon_secret_key"), bcrypt.DefaultCost)
			user = User{Username: "Anonymous", Password: string(hashed)}
			DB.Create(&user)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "User not found"})
			return
		}
	}

	var scroll Post
	if err := DB.First(&scroll, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Scroll not found"})
		return
	}

	var vote Vote
	err := DB.Where("user_id = ? AND post_id = ?", user.ID, scroll.ID).First(&vote).Error

	if err == nil {
		if vote.Value == input.Value {
			scroll.Upvotes -= vote.Value
			DB.Delete(&vote)
		} else {
			scroll.Upvotes -= vote.Value
			scroll.Upvotes += input.Value
			vote.Value = input.Value
			DB.Save(&vote)
		}
	} else {
		newVote := Vote{UserID: user.ID, PostID: scroll.ID, Value: input.Value}
		DB.Create(&newVote)
		scroll.Upvotes += input.Value
	}

	DB.Save(&scroll)

	c.JSON(http.StatusOK, gin.H{
		"upvotes":   scroll.Upvotes,
		"user_vote": input.Value,
	})
}

type CreateCommentInput struct {
	Content  string `json:"content" binding:"required"`
	Username string `json:"username"`
	ParentID *uint  `json:"parent_id"`
}

func LeaveMark(c *gin.Context) {
	id := c.Param("id")
	var input CreateCommentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var author User
	targetUsername := input.Username
	if targetUsername == "" {
		targetUsername = "Anonymous"
	}
	if err := DB.Where("username = ?", targetUsername).First(&author).Error; err != nil {
		if targetUsername == "Anonymous" {
			hashed, _ := bcrypt.GenerateFromPassword([]byte("anon_secret_key"), bcrypt.DefaultCost)
			author = User{Username: "Anonymous", Password: string(hashed)}
			DB.Create(&author)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "User not found"})
			return
		}
	}

	var scroll Post
	if err := DB.First(&scroll, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Scroll not found"})
		return
	}

	mark := Comment{
		Content:  input.Content,
		PostID:   scroll.ID,
		ParentID: input.ParentID,
		AuthorID: author.ID,
		Author:   author,
	}

	if err := DB.Create(&mark).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to leave mark"})
		return
	}

	c.JSON(http.StatusCreated, mark)
}

type UpdatePostInput struct {
	Title    string `json:"title"`
	Content  string `json:"content"`
	Username string `json:"username" binding:"required"`
}

func RewriteScroll(c *gin.Context) {
	id := c.Param("id")
	var input UpdatePostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var scroll Post
	if err := DB.Preload("Author").First(&scroll, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Scroll not found"})
		return
	}

	if scroll.Author.Username != input.Username {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the author can rewrite this scroll"})
		return
	}

	DB.Model(&scroll).Updates(Post{Title: input.Title, Content: input.Content})
	c.JSON(http.StatusOK, scroll)
}

func BurnScroll(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Username string `json:"username" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var scroll Post
	if err := DB.Preload("Author").First(&scroll, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Scroll not found"})
		return
	}

	if scroll.Author.Username != input.Username {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the author can burn the scroll"})
		return
	}

	DB.Where("post_id = ?", scroll.ID).Delete(&Comment{})
	DB.Where("post_id = ?", scroll.ID).Delete(&Vote{})
	DB.Delete(&scroll)

	c.JSON(http.StatusOK, gin.H{"message": "Scroll banished to the Wall"})
}

type UpdateCommentInput struct {
	Content  string `json:"content" binding:"required"`
	Username string `json:"username" binding:"required"`
}

func AmendMark(c *gin.Context) {
	id := c.Param("id")
	var input UpdateCommentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var mark Comment
	if err := DB.Preload("Author").First(&mark, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Mark not found"})
		return
	}

	if mark.Author.Username != input.Username {
		c.JSON(http.StatusForbidden, gin.H{"error": "You cannot change another scribe's mark"})
		return
	}

	DB.Model(&mark).Update("content", input.Content)
	c.JSON(http.StatusOK, mark)
}

func EraseMark(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Username string `json:"username" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var mark Comment
	if err := DB.Preload("Author").First(&mark, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Mark not found"})
		return
	}

	if mark.Author.Username != input.Username {
		c.JSON(http.StatusForbidden, gin.H{"error": "You cannot erase another's mark"})
		return
	}

	DB.Delete(&mark)
	c.JSON(http.StatusOK, gin.H{"message": "Mark erased"})
}
