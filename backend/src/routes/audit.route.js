import { Router } from "express";
import { getAuditTrail } from "../controllers/auditController.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const auditRouter = Router();

// Get audit logs for a document
auditRouter.get(
  "/:documentId",
  verifyJWT,
  getAuditTrail
);

export default auditRouter;
