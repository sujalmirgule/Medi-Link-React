import { Router } from "express";
import v1Router from "./v1";

const router = Router();

// Mount version 1 of the MediLink API
router.use("/v1", v1Router);

export default router;
