const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const admin = require("firebase-admin");
const finnhub = require("finnhub");
const serviceAccount = require("./key.json");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({ secret: "your-secret-key", resave: false, saveUninitialized: true }));

// Initialize Firebase
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();  

// Finnhub API Setup
const api_key = finnhub.ApiClient.instance.authentications["api_key"];
api_key.apiKey = "cvkkaf1r01qtnb8t6o6gcvkkaf1r01qtnb8t6o70";  // Replace with your actual API Key
const finnhubClient = new finnhub.DefaultApi();

// Middleware to check authentication
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect("/signin");
}

app.use(express.static('public'));


// Show Welcome Page
app.get("/", (req, res) => {
    res.render("welcome");
});

// Sign In Page
app.get("/signin", (req, res) => {
    res.render("signin", { error: null });
});

// Handle Sign In
app.post("/home", isAuthenticated, async (req, res) => {
  const symbol = req.body.symbol.toUpperCase();
  
  finnhubClient.quote(symbol, (error, data, response) => {
      if (error) {
          console.error("Stock API Error:", error);
          return res.render("home", { stockData: null, error: "Error fetching stock data." });
      }

      if (!data || Object.keys(data).length === 0 || !data.c) {
          return res.render("home", { stockData: null, error: "Stock not found. Try another symbol." });
      }

      console.log("Stock Data:", data);  // Debugging log

      res.render("home", {
          stockData: {
              symbol: symbol,
              currentPrice: data.c,
              openPrice: data.o,
              highPrice: data.h,
              lowPrice: data.l,
              prevClose: data.pc
          },
          error: null
      });
  });
});

// Sign Up Page
app.get("/signup", (req, res) => {
    res.render("signup", { error: null });
});
const bcrypt = require("bcrypt"); // Added bcrypt for password hashing

app.post("/signup", async (req, res) => {
    const { email, password } = req.body;
    try {
        const userRef = db.collection("users").doc(email);  // 🔹 Use email as document ID
        const doc = await userRef.get();

        if (doc.exists) { 
            return res.render("signup", { error: "Email already exists. Please Sign In." });
        }

        // ✅ Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        await userRef.set({ email, password: hashedPassword });  
        req.session.user = email;
        res.redirect("/home");
    } catch (error) {
        console.error("Signup Error:", error);
        res.render("signup", { error: "Signup failed. Try again." });
    }
});



// Logout
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

// Home Page (Authenticated Users Only)


app.get("/home", isAuthenticated, (req, res) => {
  res.render("home", { stockData: null, error: null });
});



app.post("/signin", async (req, res) => {
    const { email, password } = req.body;
    try {
        const userSnapshot = await db.collection("users").where("email", "==", email).get();
        if (userSnapshot.empty) {
            return res.render("signin", { error: "Invalid email or password" });
        }

        let userData;
        userSnapshot.forEach((doc) => {
            userData = doc.data();
        });

        // ✅ Compare hashed password
        const match = await bcrypt.compare(password, userData.password);
        if (!match) {
            return res.render("signin", { error: "Incorrect password" });
        }

        req.session.user = userData.email;
        res.redirect("/home");
    } catch (error) {
        console.error("Sign In Error:", error);
        res.render("signin", { error: "Sign-in failed. Try again." });
    }
});



// Handle Stock Search
app.post("/home", isAuthenticated, (req, res) => {
    const symbol = req.body.symbol.toUpperCase();

    // Fetch stock details from Finnhub API
    finnhubClient.quote(symbol, (error, data, response) => {
        if (error) {
            console.error("Stock API Error:", error);
            return res.render("home", { stockData: null, error: "Error fetching stock data." });
        }

        if (!data || !data.c) {
            return res.render("home", { stockData: null, error: "Stock not found. Try another symbol." });
        }

        res.render("home", {
            stockData: {
                symbol: symbol,
                currentPrice: data.c,
                openPrice: data.o,
                highPrice: data.h,
                lowPrice: data.l,
                prevClose: data.pc,
            },
            error: null
        });
    });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
