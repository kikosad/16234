
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum Feature {
  Chat = 'chat',
  Analyze = 'analyze',
  Story = 'story',
  Comic = 'comic',
}

export interface ComicPanel {
  description: string;
  dialogue: string;
  imageUrl?: string;
}
