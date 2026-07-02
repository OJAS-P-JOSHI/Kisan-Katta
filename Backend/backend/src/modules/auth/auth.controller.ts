import { Request, Response } from "express";
import { sendOtp, verifyOtpAndAuthenticate, getMe } from "./auth.service";
import { validateMobile, validateOtp } from "./auth.validator";
import { getAuthUser } from "./auth.middleware";
import type { ApiSuccessResponse } from "../../types/api-response";
import type {
  MeResponseDTO,
  SendOtpResponseDTO,
  VerifyOtpResponseDTO,
} from "./auth.types";

export const sendOtpHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<SendOtpResponseDTO>>
): Promise<void> => {
  const mobile = validateMobile(req.body.mobile);
  const data = sendOtp(mobile);
  res.status(200).json({ success: true, data });
};

export const verifyOtpHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<VerifyOtpResponseDTO>>
): Promise<void> => {
  const mobile = validateMobile(req.body.mobile);
  const otp = validateOtp(req.body.otp);
  const data = await verifyOtpAndAuthenticate(mobile, otp);
  res.status(200).json({ success: true, data });
};

export const getMeHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<MeResponseDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const data = await getMe(userId);
  res.status(200).json({ success: true, data });
};

// JWT is stateless — no server-side session to invalidate.
// The client discards the token; the server simply acknowledges.
export const logoutHandler = async (
  _req: Request,
  res: Response<ApiSuccessResponse<{ message: string }>>
): Promise<void> => {
  res.status(200).json({ success: true, data: { message: "Logged out successfully." } });
};
