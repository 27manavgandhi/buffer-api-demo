import { Request, Response } from 'express';
import { postService } from '../services/post.service';
import { asyncHandler } from '../utils/asyncHandler.util';
import { CreatePostDTO, UpdatePostDTO } from '../types/post.types';

export class PostController {
  createPost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const requestId = req.requestId;
    const data: CreatePostDTO = req.body;

    const post = await postService.createPost(userId, data, requestId);

    res.status(201).json({
      success: true,
      data: post,
    });
  });

  getPosts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await postService.getUserPosts(userId, page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getPost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const postId = req.params.id;

    const post = await postService.getPost(postId, userId);

    res.status(200).json({
      success: true,
      data: post,
    });
  });

  updatePost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const postId = req.params.id;
    const requestId = req.requestId;
    const data: UpdatePostDTO = req.body;

    const post = await postService.updatePost(postId, userId, data, requestId);

    res.status(200).json({
      success: true,
      data: post,
    });
  });

  deletePost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const postId = req.params.id;
    const requestId = req.requestId;

    await postService.deletePost(postId, userId, requestId);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  });
}

export const postController = new PostController();