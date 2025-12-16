// Notification Type Definitions

export type NotificationStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "failed";
export type NotificationScope = "all" | "event" | "organizer";
export type DeviceType = "ios" | "android" | "web";
export type RecipientStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "failed"
  | "opened";
export type ActionType = "open_event" | "open_url" | "open_screen" | null;

export interface Notification {
  notification_id: string;
  sender_type: "system_user" | "organizer";
  system_user_id?: string;
  organizer_id?: string;
  title: string;
  body: string;
  image_url?: string;
  scope: NotificationScope;
  target_event_id?: string;
  target_organizer_id?: string;
  status: NotificationStatus;
  total_recipients?: number;
  total_sent?: number;
  total_delivered?: number;
  total_failed?: number;
  total_opened?: number;
  action_type?: ActionType;
  action_data?: Record<string, any>;
  scheduled_at?: string;
  created_at: string;
  sent_at?: string;
  updated_at?: string;
  sender?: {
    user_id: string;
    username: string;
  };
}

export interface NotificationStats {
  notification_id: string;
  title: string;
  total_recipients: number;
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_opened: number;
  delivery_rate: number;
  open_rate: number;
  status: NotificationStatus;
  sent_at?: string;
}

export interface CreateNotificationRequest {
  title: string;
  body: string;
  image_url?: string;
  scope: NotificationScope;
  target_event_id?: string;
  target_organizer_id?: string;
  action_type?: ActionType;
  action_data?: Record<string, any>;
  scheduled_at?: string;
}

export interface UpdateNotificationRequest {
  title?: string;
  body?: string;
  image_url?: string;
  scope?: NotificationScope;
  target_event_id?: string;
  target_organizer_id?: string;
  action_type?: ActionType;
  action_data?: Record<string, any>;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  status?: NotificationStatus;
  scope?: NotificationScope;
  from_date?: string;
  to_date?: string;
}

export interface RescheduleRequest {
  scheduled_at: string;
}

export interface SendResponse {
  total_recipients: number;
  total_sent: number;
  total_failed: number;
}
