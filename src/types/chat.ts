export type Sender = 'user' | 'agent';

export class Message {
  id: string = '';
  text: string = '';
  sender: Sender = 'user';
  timestamp: Date = new Date();
  type: 'text' | 'script' | 'action' = 'text';

  constructor(id: string, text: string, sender: Sender, timestamp: Date, type: 'text' | 'script' | 'action') {
    this.id = id;
    this.text = text;
    this.sender = sender;
    this.timestamp = timestamp;
    this.type = type;
  }
}

export class ScriptMessage extends Message {
  constructor(id: string, text: string, sender: Sender, timestamp: Date, type: 'text' | 'script' | 'action') {
    super(id, text, sender, timestamp, type);
  }

  responseMessage: String = '';
  title: String = '';
  description: String = '';
  content: String = '';
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentRequestId: string | null;
}

