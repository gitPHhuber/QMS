import { $authHost } from "./index";

export interface TaskComment {
  id: number;
  taskId: number;
  parentId: number | null;
  authorId: number;
  author?: { id: number; name: string; surname: string } | null;
  body: string;
  mentions: number[];
  createdAt: string;
  updatedAt: string;
}

export const fetchComments = async (taskId: number): Promise<TaskComment[]> => {
  const { data } = await $authHost.get(`api/tasks/${taskId}/comments`);
  return data;
};

export const createComment = async (
  taskId: number,
  body: string,
  options?: { parentId?: number; mentions?: number[] }
): Promise<TaskComment> => {
  const { data } = await $authHost.post(`api/tasks/${taskId}/comments`, {
    body,
    parentId: options?.parentId || null,
    mentions: options?.mentions || [],
  });
  return data;
};

export const updateComment = async (
  taskId: number,
  commentId: number,
  body: string
): Promise<TaskComment> => {
  const { data } = await $authHost.patch(
    `api/tasks/${taskId}/comments/${commentId}`,
    { body }
  );
  return data;
};

export const deleteComment = async (taskId: number, commentId: number): Promise<void> => {
  await $authHost.delete(`api/tasks/${taskId}/comments/${commentId}`);
};
