// services/commentService.ts
import { Comment } from '../types';
import { mockComments } from '../data/mockData';

let comments: Comment[] = [...mockComments];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const commentService = {
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    await delay(700);
    return comments.filter(c => c.postId === postId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async addComment(postId: string, authorName: string, content: string): Promise<Comment> {
    await delay(1000);
    const newComment: Comment = {
      id: `c${Date.now()}`,
      postId,
      authorName,
      content,
      createdAt: new Date().toISOString(),
    };
    comments.push(newComment);
    return newComment;
  },
};
