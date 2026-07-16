import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { authenticate } from "../auth/auth.middleware";
import {
  createPollHandler,
  getHistoryHandler,
  getMyPollsHandler,
  getPollHandler,
  getPollsHandler,
  submitVoteHandler,
} from "./farmer-price.controller";

const router = Router();

router.post("/polls", authenticate, asyncHandler(createPollHandler));
router.get("/polls", authenticate, asyncHandler(getPollsHandler));
router.get("/polls/my", authenticate, asyncHandler(getMyPollsHandler));
router.get("/polls/:pollId", authenticate, asyncHandler(getPollHandler));
router.post("/polls/:pollId/vote", authenticate, asyncHandler(submitVoteHandler));
router.get("/history/:crop", authenticate, asyncHandler(getHistoryHandler));

export default router;
