import { Request, Response } from "express";
import type { VerificationResponseDTO } from "./verification.dto";
import { verifyVolunteer } from "./verification.service";
import { validateVolunteerIdParam } from "./verification.validators";

export const verifyVolunteerHandler = async (
  req: Request,
  res: Response<VerificationResponseDTO>
): Promise<void> => {
  const volunteerId = validateVolunteerIdParam(req.params);
  const outcome = await verifyVolunteer(volunteerId);

  if (outcome.kind === "not_found") {
    res.status(404).json(outcome.body);
    return;
  }

  // Inactive and success both use 200 with verified flag.
  res.status(200).json(outcome.body);
};
