import { Context as ContextTelegraf } from 'telegraf';

export interface ContextInterface extends ContextTelegraf {
  session: {
    type: 'done' | 'edit' | 'delete';
  };
}
