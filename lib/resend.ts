import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const RECEIPT_FROM_EMAIL = `Cafe POS <receipts@${process.env.RESEND_DOMAIN}>`;
