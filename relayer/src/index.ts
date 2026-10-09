import "dotenv/config";
import express from "express";
import { createApiRouter } from "./api/routes.js";
import { watchPaymentRequested, watchBaseSepoliaPaymentRequested, watchReleased } from "./services/events.js";

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(createApiRouter());

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  console.log(`Brazen relayer listening on port ${port}`);

  watchPaymentRequested((event) => {
    console.log(
      `[event] PaymentRequested (Sepolia) payer=${event.payer} recipient=${event.recipient} amount=${event.amount} destChainId=${event.destChainId} tx=${event.transactionHash}`,
    );
  });

  watchBaseSepoliaPaymentRequested((event) => {
    console.log(
      `[event] PaymentRequested (Base Sepolia) payer=${event.payer} recipient=${event.recipient} amount=${event.amount} destChainId=${event.destChainId} tx=${event.transactionHash}`,
    );
  });

  watchReleased((event) => {
    console.log(
      `[event] Released recipient=${event.recipient} amount=${event.amount} fee=${event.fee} sourceRef=${event.sourceRef} tx=${event.transactionHash}`,
    );
  });
});
