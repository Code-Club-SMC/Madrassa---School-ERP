import { Toaster as Sonner, toast } from "sonner";
import React from "react";

function sanitizeMessage(msg: unknown): string | React.ReactNode {
  if (!msg) return "خرابی پیش آئی · An error occurred";
  if (typeof msg !== "string") {
    if (msg instanceof Error) {
      msg = msg.message;
    } else if (typeof msg === "object" && "message" in (msg as any)) {
      msg = String((msg as any).message);
    } else {
      return msg as React.ReactNode;
    }
  }

  let text = String(msg).trim();

  // If text is JSON, extract inner error/message if present
  if (text.startsWith("{") && text.endsWith("}")) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.error && typeof parsed.error === "string") {
        text = parsed.error;
      } else if (parsed.message && typeof parsed.message === "string") {
        text = parsed.message;
      }
    } catch {}
  }

  const lower = text.toLowerCase();

  // Database / internal query dumps
  if (
    lower.includes("failed query") ||
    lower.includes("syntax error") ||
    lower.includes("violates") ||
    lower.includes('select "') ||
    lower.includes('column "') ||
    lower.includes('relation "') ||
    lower.includes('table "') ||
    lower.includes("insert into") ||
    lower.includes('update "') ||
    lower.includes("delete from") ||
    lower.includes("params:") ||
    lower.includes("neondberror") ||
    lower.includes("drizzlequeryerror") ||
    lower.includes("postgreserror") ||
    lower.includes("search_path") ||
    lower.includes("neon_auth") ||
    lower.includes("drizzle")
  ) {
    console.error("[Toast Sanitizer: Database/Internal Error Filtered]", text);
    if (
      lower.includes("23505") ||
      lower.includes("unique constraint") ||
      lower.includes("duplicate key")
    ) {
      return "یہ ریکارڈ پہلے سے موجود ہے · This record already exists";
    }
    if (lower.includes("23503") || lower.includes("foreign key")) {
      return "متعلقہ ریکارڈ موجود نہیں ہے · Related record not found";
    }
    if (lower.includes("23502") || lower.includes("not-null")) {
      return "تمام ضروری معلومات درج کرنا لازمی ہیں · Required fields are missing";
    }
    return "درخواست پر کارروائی نہیں ہو سکی، براہ کرم دوبارہ کوشش کریں · Request could not be processed, please try again.";
  }

  // Network or connection errors
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("load failed") ||
    lower.includes("connection reset") ||
    lower.includes("err_connection_refused")
  ) {
    return "سرور سے رابطہ نہیں ہو سکا، براہ کرم انٹرنیٹ کنکشن چیک کریں · Could not connect to server, please check connection.";
  }

  // HTML / unexpected server responses
  if (lower.startsWith("<!doctype html") || lower.startsWith("<html")) {
    return "سرور پر غیر متوقع خرابی پیش آئی · Unexpected server error.";
  }

  return text;
}

function sanitizeData(data?: any) {
  if (!data || typeof data !== "object") return data;
  if (data.description) {
    return { ...data, description: sanitizeMessage(data.description) };
  }
  return data;
}

if (typeof window !== "undefined" && !(toast as any).__is_sanitized__) {
  (toast as any).__is_sanitized__ = true;

  const originalError = toast.error.bind(toast);
  toast.error = ((message: any, data?: any) => {
    return originalError(sanitizeMessage(message) as any, sanitizeData(data));
  }) as typeof toast.error;

  const originalWarning = toast.warning.bind(toast);
  toast.warning = ((message: any, data?: any) => {
    return originalWarning(sanitizeMessage(message) as any, sanitizeData(data));
  }) as typeof toast.warning;

  const originalInfo = toast.info.bind(toast);
  toast.info = ((message: any, data?: any) => {
    return originalInfo(sanitizeMessage(message) as any, sanitizeData(data));
  }) as typeof toast.info;
}

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
