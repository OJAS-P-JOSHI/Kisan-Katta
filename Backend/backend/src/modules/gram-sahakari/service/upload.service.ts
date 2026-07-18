import { randomUUID } from "crypto";
import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../../config/cloudinary";
import { AppError } from "../../../utils/AppError";
import {
  CLOUDINARY_GRAM_SAHAKARI_FOLDER,
  DOCUMENT_IMAGE_MAX_EDGE_PX,
  EDITABLE_DOCUMENT_TYPES,
  MAX_EXPERIENCE_CERTIFICATES,
} from "../gram-sahakari.constants";
import type { DocumentType } from "../types/application.types";
import type {
  ICloudinaryDocument,
  IExperienceCertificate,
  UploadableDocumentField,
} from "../interfaces/application.interface";

const buildPublicId = (): string => randomUUID().replace(/-/g, "");

const uploadBufferToCloudinary = (
  buffer: Buffer,
  publicId: string
): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    // [UPLOAD-DEBUG] About to stream buffer to Cloudinary.
    // eslint-disable-next-line no-console
    console.log("[UPLOAD-DEBUG] Uploading to Cloudinary, publicId =", publicId);
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
          // [UPLOAD-DEBUG] Cloudinary reported a failure.
          // eslint-disable-next-line no-console
          console.error("[UPLOAD-DEBUG] Cloudinary upload FAILURE:", error);
          reject(new AppError("Cloudinary upload failed.", 502));
          return;
        }
        // [UPLOAD-DEBUG] Cloudinary upload succeeded.
        // eslint-disable-next-line no-console
        console.log("[UPLOAD-DEBUG] Cloudinary upload SUCCESS:", result.public_id);
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

const documentFieldMap: Record<UploadableDocumentField, keyof import("../interfaces/application.interface").IGramSahakariApplication> = {
  photo: "photo",
  aadhaarFront: "aadhaarFront",
  aadhaarBack: "aadhaarBack",
  pan: "panImage",
  cancelledCheque: "cancelledChequeImage",
};

export const uploadGramSahakariDocument = async (
  file: Express.Multer.File,
  documentType: DocumentType,
  options: {
    existingDocument?: ICloudinaryDocument | null;
    existingCertificates?: IExperienceCertificate[];
  } = {}
): Promise<{ documentType: DocumentType; document: ICloudinaryDocument | IExperienceCertificate }> => {
  // [UPLOAD-DEBUG] Confirms execution reaches the upload service.
  // eslint-disable-next-line no-console
  console.log("[UPLOAD-DEBUG] Entering upload service:", {
    documentType,
    fileFieldname: file?.fieldname,
    fileSize: file?.size,
    hasBuffer: Boolean(file?.buffer),
  });

  if (documentType === "experienceCertificate") {
    if (
      options.existingCertificates &&
      options.existingCertificates.length >= MAX_EXPERIENCE_CERTIFICATES
    ) {
      throw new AppError(
        `You can upload at most ${MAX_EXPERIENCE_CERTIFICATES} experience certificates.`,
        400
      );
    }

    const publicId = buildPublicId();
    const result = await uploadBufferToCloudinary(file.buffer, publicId);
    return {
      documentType,
      document: toCloudinaryDocument(result),
    };
  }

  if (!(EDITABLE_DOCUMENT_TYPES as readonly string[]).includes(documentType)) {
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
