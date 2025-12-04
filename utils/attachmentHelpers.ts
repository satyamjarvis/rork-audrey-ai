import type { Attachment } from '@/contexts/CalendarContext';

export type AttachmentSourceFeature = 'analytics' | 'planner' | 'notes' | 'mindmap' | 'external';

export interface CreateAttachmentParams {
  name: string;
  type: string;
  uri: string;
  size: number;
  sourceFeature?: AttachmentSourceFeature;
  sourceId?: string;
  metadata?: {
    trackerType?: string;
    taskId?: string;
    noteId?: string;
    mindmapId?: string;
    [key: string]: any;
  };
  permissions?: 'edit_download' | 'view_download' | 'view_only';
}

export function createAttachmentWithMetadata(params: CreateAttachmentParams): Attachment {
  return {
    id: `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: params.name,
    type: params.type,
    uri: params.uri,
    size: params.size,
    uploadedAt: new Date().toISOString(),
    sourceFeature: params.sourceFeature || 'external',
    sourceId: params.sourceId,
    metadata: params.metadata,
    permissions: params.permissions || 'edit_download',
  };
}

export function createAnalyticsAttachment(
  name: string,
  uri: string,
  size: number,
  trackerId?: string,
  trackerType?: string
): Attachment {
  return createAttachmentWithMetadata({
    name,
    type: name.endsWith('.csv') ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uri,
    size,
    sourceFeature: 'analytics',
    sourceId: trackerId,
    metadata: {
      trackerType,
    },
  });
}

export function createPlannerAttachment(
  name: string,
  uri: string,
  size: number,
  taskId?: string
): Attachment {
  return createAttachmentWithMetadata({
    name,
    type: 'application/json',
    uri,
    size,
    sourceFeature: 'planner',
    sourceId: taskId,
    metadata: {
      taskId,
    },
  });
}

export function createNoteAttachment(
  name: string,
  uri: string,
  size: number,
  noteId?: string
): Attachment {
  return createAttachmentWithMetadata({
    name,
    type: 'text/plain',
    uri,
    size,
    sourceFeature: 'notes',
    sourceId: noteId,
    metadata: {
      noteId,
    },
  });
}

export function createMindMapAttachment(
  name: string,
  uri: string,
  size: number,
  mindmapId?: string
): Attachment {
  return createAttachmentWithMetadata({
    name,
    type: 'application/json',
    uri,
    size,
    sourceFeature: 'mindmap',
    sourceId: mindmapId,
    metadata: {
      mindmapId,
    },
  });
}
