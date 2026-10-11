import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type AgreementStatus =
  | 'draft'
  | 'pending_signatures'
  | 'signed_by_creator'
  | 'signed_by_brand'
  | 'fully_executed'
  | 'terminated';

export interface ISignatureRecord {
  signerId: Types.ObjectId;
  role: 'creator' | 'brand';
  signatureText: string;
  signedAt: Date;
  ipAddress?: string;
}

export interface IAgreement extends Document {
  campaignId: Types.ObjectId;
  brandId: Types.ObjectId;
  creatorId: Types.ObjectId;
  title: string;
  scopeOfWork: string;
  paymentTerms: string;
  totalCompensation: number;
  currency: string;
  ipOwnershipType: 'full_transfer' | 'exclusive_license' | 'non_exclusive';
  usageRights: {
    channels: string[];
    territory: string;
    durationMonths: number;
  };
  confidentialityTerms: string;
  status: AgreementStatus;
  signatures: ISignatureRecord[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const SignatureRecordSchema = new Schema<ISignatureRecord>({
  signerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['creator', 'brand'], required: true },
  signatureText: { type: String, required: true },
  signedAt: { type: Date, default: Date.now },
  ipAddress: String,
});

const AgreementSchema = new Schema<IAgreement>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    scopeOfWork: {
      type: String,
      required: true,
    },
    paymentTerms: {
      type: String,
      required: true,
    },
    totalCompensation: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    ipOwnershipType: {
      type: String,
      enum: ['full_transfer', 'exclusive_license', 'non_exclusive'],
      default: 'exclusive_license',
    },
    usageRights: {
      channels: [String],
      territory: { type: String, default: 'Worldwide' },
      durationMonths: { type: Number, default: 12 },
    },
    confidentialityTerms: {
      type: String,
      default: 'Standard non-disclosure terms apply to all campaign materials and trade secrets.',
    },
    status: {
      type: String,
      enum: [
        'draft',
        'pending_signatures',
        'signed_by_creator',
        'signed_by_brand',
        'fully_executed',
        'terminated',
      ],
      default: 'draft',
      index: true,
    },
    signatures: [SignatureRecordSchema],
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

export const Agreement: Model<IAgreement> =
  mongoose.models.Agreement || mongoose.model<IAgreement>('Agreement', AgreementSchema);
