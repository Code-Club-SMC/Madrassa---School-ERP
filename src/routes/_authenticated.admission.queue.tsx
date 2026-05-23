import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export const Route = createFileRoute("/_authenticated/admission/queue")({
  component: () => (
    <PlaceholderPage title="Application Queue" titleUrdu="آن لائن درخواستیں" icon={Inbox} />
  ),
});
