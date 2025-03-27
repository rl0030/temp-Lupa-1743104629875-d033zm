import { LupaActivity } from "./activities"
import { UID } from "./common"
import { NotificationType } from "./notifications"
import { ScheduledMeetingClientType } from "./user"

export type SellerPaymentsData<T> = {
    id: string,
    amount: number,
    created: string,
    metadata: T,
    source_transaction: string,
    balance_transaction: string,
    destination: string,
    transfer_group: string;
}
  
export enum ProductType {
    PROGRAM,
    SESSION_PACKAGE
}

export type CommonPurchasePaymentIntentMetadata = {
    notification_type: NotificationType,
    seller_stripe_id: string,
    platform_percentage: number,
    product_uid: UID,
    client_uid: UID,
    seller_uid: UID,
    total_amount: string;
    product_type: ProductType;
    payout_text: string;
}

// TODO: Change to SessionPackagePurchase...
export type SessionPurchasePaymentIntentMetadata = CommonPurchasePaymentIntentMetadata & {
    activity: LupaActivity,
    client_type: ScheduledMeetingClientType,
}

export type ProgramPurchasePaymentIntentMetadata = CommonPurchasePaymentIntentMetadata;