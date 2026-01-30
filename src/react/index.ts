/**
 * Comments Component - React UI
 *
 * Drop-in React components for the comments system.
 * These components provide a fully managed UI for comments,
 * threads, reactions, and typing indicators.
 */

export {
  CommentsProvider,
  useComments,
  type CommentsContextValue,
  type CommentsStyles,
  type CommentsProviderProps,
} from "./CommentsProvider";

export {
  Comments,
  type CommentsProps,
} from "./Comments";

export {
  Thread,
  type ThreadProps,
} from "./Thread";

export {
  Comment,
  type CommentProps,
} from "./Comment";

export {
  AddComment,
  type AddCommentProps,
} from "./AddComment";

export {
  ReactionPicker,
  type ReactionPickerProps,
} from "./ReactionPicker";

export {
  TypingIndicator,
  type TypingIndicatorProps,
} from "./TypingIndicator";
