import { Message as MessageType } from '../../types/chat';
import styles from './Message.module.css';

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const isUser = message.sender === 'user';

  return (
    <div className={`${styles.message} ${isUser ? styles.userMessage : styles.agentMessage}`}>
      <div className={styles.messageContent}>
        <div className={styles.messageText}>{message.text}</div>
        {/* <div className={styles.messageTime}>
          {message.timestamp.getDate()}
        </div> */}
      </div>
    </div>
  );
}

