const express = require("express")
const { Sequelize } = require("sequelize")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const logger = require("./logger")
const auth = require("./middleware/auth")

if (!process.env.PORT) {
  throw new Error("PORT is not set in the environment variables")
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in the environment variables")
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in the environment variables")
}

const app = express()
const port = process.env.PORT

app.use(cors())
app.use(express.json())

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
})

const KPI = require("./models/kpi")(sequelize, Sequelize.DataTypes)
const User = sequelize.define("User", {
  username: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
  },
})

app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body
    let user = await User.findOne({ where: { username } })
    if (user) {
      return res.status(400).json({ msg: "User already exists" })
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    user = await User.create({
      username,
      password: hashedPassword,
    })
    const payload = {
      user: {
        id: user.id,
      },
    }
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
      if (err) throw err
      res.json({ token })
    })
  } catch (err) {
    logger.error("Error in user registration:", err)
    res.status(500).send("Server error")
  }
})

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ where: { username } })
    if (!user) {
      return res.status(400).json({ msg: "Invalid Credentials" })
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials" })
    }
    const payload = {
      user: {
        id: user.id,
      },
    }
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
      if (err) throw err
      res.json({ token })
    })
  } catch (err) {
    logger.error("Error in user login:", err)
    res.status(500).send("Server error")
  }
})

app.get("/api/kpis", auth, async (req, res) => {
  try {
    const kpis = await KPI.findAll()
    res.json(kpis)
  } catch (err) {
    logger.error("Error fetching KPIs:", err)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.post("/api/kpis", auth, async (req, res) => {
  try {
    const { title, value, change, category, data } = req.body
    const kpi = await KPI.create({ title, value, change, category, data })
    res.status(201).json(kpi)
  } catch (err) {
    logger.error("Error creating KPI:", err)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.get("/api/kpis/:id", auth, async (req, res) => {
  try {
    const kpi = await KPI.findByPk(req.params.id)
    if (!kpi) {
      return res.status(404).json({ msg: "KPI not found" })
    }
    res.json(kpi)
  } catch (err) {
    logger.error("Error fetching KPI:", err)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.put("/api/kpis/:id", auth, async (req, res) => {
  try {
    const { title, value, change, category, data } = req.body
    let kpi = await KPI.findByPk(req.params.id)
    if (!kpi) {
      return res.status(404).json({ msg: "KPI not found" })
    }
    kpi = await kpi.update({ title, value, change, category, data })
    res.json(kpi)
  } catch (err) {
    logger.error("Error updating KPI:", err)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.delete("/api/kpis/:id", auth, async (req, res) => {
  try {
    const kpi = await KPI.findByPk(req.params.id)
    if (!kpi) {
      return res.status(404).json({ msg: "KPI not found" })
    }
    await kpi.destroy()
    res.json({ msg: "KPI removed" })
  } catch (err) {
    logger.error("Error deleting KPI:", err)
    res.status(500).json({ error: "Internal server error" })
  }
})

app.use((err, req, res, next) => {
  logger.error(err.stack)
  res.status(500).send("Something broke!")
})

sequelize
  .sync()
  .then(() => {
    app.listen(port, () => {
      logger.info(`Backend API listening at http://localhost:${port}`)
    })
  })
  .catch((err) => {
    logger.error("Unable to connect to the database:", err)
  })

