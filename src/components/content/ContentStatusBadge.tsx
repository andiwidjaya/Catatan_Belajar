import React from "react";
import { Badge } from "@/components/ui/Badge";
import { ContentStatus } from "@/types/database.types";

export interface ContentStatusBadgeProps {
  status: ContentStatus;
}

export function ContentStatusBadge({ status }: ContentStatusBadgeProps) {
  switch (status) {
    case "unread":
      return <Badge variant="secondary" size="sm">Unread</Badge>;
    case "in_progress":
      return <Badge variant="warning" size="sm">In Progress</Badge>;
    case "completed":
      return <Badge variant="success" size="sm">Completed</Badge>;
    case "review":
      return <Badge variant="default" size="sm">Review Queue</Badge>;
    default:
      return <Badge variant="outline" size="sm">{status}</Badge>;
  }
}
