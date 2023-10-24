import { Context as ContextTelegraf, Scenes } from 'telegraf';

export interface ContextInterface extends ContextTelegraf {
  session: {
    type: 'done' | 'edit' | 'delete';
  };
}

export interface SceneContextInterface extends Scenes.SceneContext {}
