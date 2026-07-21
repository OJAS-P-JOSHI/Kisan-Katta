import { randomUUID } from "crypto";
import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../../config/cloudinary";
import { AppError } from "../../../utils/AppError";
import {
  CLOUDINARY_GRAM_SAHAKARI_FOLDER,
  DOCUMENT_IMAGE_MAX_EDGE_PX,
  DOCUMENT_TYPES,
} from "../gram-sahakari.constants";
import type { DocumentType } from "../types/application.types";
import type {
  ICloudinaryDocument,
  UploadableDocumentField,
} from "../interfaces/application.interface";

const buildPublicId = (): string => randomUUID().replace(/-/g, "");

const uploadBufferToCloudinary = (
  buffer: Buffer,
  publicId: string
): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_GRAM_SAHAKARI_FOLDER,
        public_id: publicId,
        resource_type: "image",
        overwrite: false,
        transformation: [
          {
            width: DOCUMENT_IMAGE_MAX_EDGE_PX,
            height: DOCUMENT_IMAGE_MAX_EDGE_PX,
            crop: "limit",
          },
          {
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError("Cloudinary upload failed.", 502));
          return;
        }
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });

const deleteCloudinaryImage = async (publicId: string): Promise<void> => {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new AppError("Failed to delete image from Cloudinary.", 502);
  }
};

const toCloudinaryDocument = (result: UploadApiResponse): ICloudinaryDocument => ({
  url: result.secure_url,
  publicId: result.public_id,
});

const documentFieldMap: Record<
  UploadableDocumentField,
  keyof import("../interfaces/application.interface").IGramSahakariApplication
> = {
  photo: "photo",
  aadhaarFront: "aadhaarFront",
  aadhaarBack: "aadhaarBack",
  cancelledCheque: "cancelledChequeImage",
};

export const uploadGramSahakariDocument = async (
  file: Express.Multer.File,
  documentType: DocumentType,
  options: {
    existingDocument?: ICloudinaryDocument | null;
  } = {}
): Promise<{ documentType: DocumentType; document: ICloudinaryDocument }> => {
  if (!(DOCUMENT_TYPES as readonly string[]).includes(documentType)) {
    throw new AppError("Unsupported document type.", 400);
  }

  const publicId = buildPublicId();
  const result = await uploadBufferToCloudinary(file.buffer, publicId);
  const document = toCloudinaryDocument(result);

  if (options.existingDocument?.publicId) {
    try {
      await deleteCloudinaryImage(options.existingDocument.publicId);
    } catch {
      // Best-effort cleanup of replaced asset.
    }
  }

  return { documentType, document };
};

export const getDocumentFieldName = (
  documentType: UploadableDocumentField
): keyof import("../interfaces/application.interface").IGramSahakariApplication =>
  documentFieldMap[documentType];

export const deleteCloudinaryDocument = async (publicId: string): Promise<void> => {
  await deleteCloudinaryImage(publicId);
};
