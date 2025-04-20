import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { Host } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends Host {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "quiz-master-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const host = await storage.getHostByUsername(username);
        if (!host || !(await comparePasswords(password, host.password))) {
          return done(null, false);
        } else {
          return done(null, host);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((host, done) => {
    done(null, host.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const host = await storage.getHost(id);
      done(null, host);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingHost = await storage.getHostByUsername(req.body.username);
      if (existingHost) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const host = await storage.createHost({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      const hostWithoutPassword = { ...host, password: undefined };

      req.login(host, (err) => {
        if (err) return next(err);
        res.status(201).json(hostWithoutPassword);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, host, info) => {
      if (err) return next(err);
      if (!host) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      req.login(host, (err) => {
        if (err) return next(err);
        const hostWithoutPassword = { ...host, password: undefined };
        res.status(200).json(hostWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    const hostWithoutPassword = { ...req.user, password: undefined };
    res.json(hostWithoutPassword);
  });
}
