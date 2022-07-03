import { IAction } from '../types/interfaces';

export class BaseAction<T = any> implements IAction<T> {
  contexts: Set<string> = new Set();
}
