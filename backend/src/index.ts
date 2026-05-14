import "./env"; // must be first — populates process.env before any other module evaluates

import app from "./app";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — check the root .env file");
}

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
