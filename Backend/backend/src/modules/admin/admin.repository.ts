import { Admin, type IAdmin } from "./admin.model";
import type { AdminPermission, AdminRole } from "./admin.constants";

export const findAdminByPhone = (phoneNumber: string): Promise<IAdmin | null> =>
  Admin.findOne({ phoneNumber }).lean<IAdmin>().exec();

export const findAdminByUserId = (userId: string): Promise<IAdmin | null> =>
  Admin.findOne({ userId, isActive: true }).lean<IAdmin>().exec();

export const findAdminById = (id: string): Promise<IAdmin | null> =>
  Admin.findById(id).lean<IAdmin>().exec();

export const createAdmin = async (input: {
  name: string;
  phoneNumber: string;
  email: string;
  role: AdminRole;
  permissions: readonly AdminPermission[];
  address: IAdmin["address"];
}): Promise<IAdmin> => {
  const doc = await Admin.create({
    ...input,
    permissions: [...input.permissions],
    isActive: true,
    userId: null,
    lastLoginAt: null,
  });
  return doc.toObject();
};

export const touchAdminLogin = async (
  adminId: string,
  userId: string
): Promise<IAdmin | null> =>
  Admin.findByIdAndUpdate(
    adminId,
    { $set: { lastLoginAt: new Date(), userId } },
    { new: true }
  )
    .lean<IAdmin>()
    .exec();
