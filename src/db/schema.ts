import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  displayName: text("display_name"),
  consentAt: timestamp("consent_at"),
  storiesSinceMining: integer("stories_since_mining").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  protocolId: text("protocol_id").notNull(),
  currentStepId: text("current_step_id").notNull(),
  status: text("status").notNull().default("active"), // active | completed | paused_crisis
  summary: text("summary"),
  messages: jsonb("messages").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const stories = pgTable("stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  sessionId: uuid("session_id").references(() => sessions.id),
  title: text("title").notNull(),
  narrative: text("narrative").notNull(),
  analyzedAt: timestamp("analyzed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const observations = pgTable("observations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  storyId: uuid("story_id")
    .notNull()
    .references(() => stories.id),
  kind: text("kind").notNull(), // trigger | emotion | thought | behavior | outcome | person
  content: text("content").notNull(),
  quote: text("quote").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const patterns = pgTable("patterns", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  hypothesis: text("hypothesis").notNull(),
  explanation: text("explanation").notNull(),
  status: text("status").notNull().default("candidate"), // candidate | verified | confirmed | rejected | dismissed
  confidence: real("confidence").notNull().default(0),
  verifierNotes: text("verifier_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const patternEvidence = pgTable("pattern_evidence", {
  id: uuid("id").primaryKey().defaultRandom(),
  patternId: uuid("pattern_id")
    .notNull()
    .references(() => patterns.id),
  observationId: uuid("observation_id")
    .notNull()
    .references(() => observations.id),
  quote: text("quote").notNull(),
  verdict: text("verdict").notNull().default("supports"), // supports | weak | rejected
});

export const checkins = pgTable("checkins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  area: text("area").notNull(),
  question: text("question").notNull(),
  selfRating: integer("self_rating").notNull(),
  answer: text("answer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const blindspots = pgTable("blindspots", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  checkinId: uuid("checkin_id").references(() => checkins.id),
  summary: text("summary").notNull(),
  selfView: text("self_view").notNull(),
  evidenceView: text("evidence_view").notNull(),
  evidence: jsonb("evidence").notNull().default([]), // [{ observationId, quote }]
  status: text("status").notNull().default("proposed"), // proposed | confirmed | dismissed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const experiments = pgTable("experiments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  patternId: uuid("pattern_id").references(() => patterns.id),
  title: text("title").notNull(),
  action: text("action").notNull(),
  prediction: text("prediction").notNull(),
  status: text("status").notNull().default("active"), // active | completed | abandoned
  outcome: text("outcome"),
  reflection: text("reflection"),
  predictionCameTrue: boolean("prediction_came_true"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const safetyEvents = pgTable("safety_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  sessionId: uuid("session_id").references(() => sessions.id),
  source: text("source").notNull(), // keyword | classifier
  trigger: text("trigger").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
