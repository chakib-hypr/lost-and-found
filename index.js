require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();
const jwt = require("jsonwebtoken");
app.use(express.json());



app.get("/", (req, res) => {
  res.json({ message: "Lost & Found API is running" });
});

app.post("/items" , requireAuth, async (req, res) => {
  const { title, description, category, type, location } = req.body;

  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  if (!type) {
    return res.status(400).json({ error: "type is required" });
  }

  if (type !== "lost" && type !== "found") {
    return res.status(400).json({ error: "type must be 'lost' or 'found'" });
  }

  const { data, error } = await supabase
    .from("items")
    .insert({ title, description, category, type, location, owner_id: req.userId })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});
app.get("/items", async (req, res) => {
  let query = supabase.from("items").select("*");

  if (req.query.type) {
    query = query.eq("type", req.query.type);
  }

  if (req.query.category) {
    query = query.eq("category", req.query.category);
  }

  if (req.query.status) {
    query = query.eq("status", req.query.status);
  }

  if (req.query.q) {
    query = query.or(
      `title.ilike.%${req.query.q}%,description.ilike.%${req.query.q}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.get("/items/:id", async (req, res) => {
  const id = Number(req.params.id);

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: "item not found" });
  }

  res.json(data);
});



app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: "password must be at least 6 characters" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .insert({ username, password_hash: passwordHash })
    .select("id, username")
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "username already taken" });
    }
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (!user) {
    return res.status(401).json({ error: "invalid username or password" });
  }

  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) {
    return res.status(401).json({ error: "invalid username or password" });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.json({ token });
});
function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "login required" });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid or expired token" });
  }
}

app.put("/items/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { title, description, category, type, location } = req.body;

  const { data: item, error: findError } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (findError) {
    return res.status(500).json({ error: findError.message });
  }

  if (!item) {
    return res.status(404).json({ error: "item not found" });
  }

  if (item.owner_id !== req.userId) {
    return res.status(403).json({ error: "you can only update your own reports" });
  }

  if (type && type !== "lost" && type !== "found") {
    return res.status(400).json({ error: "type must be 'lost' or 'found'" });
  }

  const { data, error } = await supabase
    .from("items")
    .update({ title, description, category, type, location })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

app.patch("/items/:id/recovered", requireAuth, async (req, res) => {
  const id = Number(req.params.id);

  const { data: item, error: findError } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (findError) {
    return res.status(500).json({ error: findError.message });
  }

  if (!item) {
    return res.status(404).json({ error: "item not found" });
  }

  if (item.owner_id !== req.userId) {
    return res.status(403).json({ error: "you can only update your own reports" });
  }

  const { data, error } = await supabase
    .from("items")
    .update({ status: "recovered" })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});
app.listen(3000, () => {
  console.log("Server running (http://localhost:3000)");
});