interface DMMessageRawType {
  id: string;
  senderId: string;
  recipientId: string;
  createdAt: string;
  text: string;
  urls: string[];
  mediaUrls: string[];
  reactions?: [
    {
      senderId: string;
      reactionKey: string;
      eventId: string;
      createdAt: string;
    }
  ];
}

interface DMMessageType extends DMMessageRawType {
  date: Date;
  conversationId: string;
}
interface UserRawType {
  username: string;
  accountId: string;
  createdAt?: string;
  accountDisplayName: string;
  img?: string;
  re?: string | RegExp;
  listIn?: boolean;
  link?: string;
  enableLink?: boolean;
  index?: number;
}

interface UserType extends UserRawType {
  date?: Date;
}

type DMMessagesRawPartType = KeyValueType<DMMessagesRawType>;
type DMMessagesRawType = {
  dmConversation: {
    conversationId: string;
    messages: [
      {
        messageCreate: DMMessageRawType;
      }
    ];
  };
}[];

declare const YTD: {
  user?: {
    regist?: KeyValueType<UserRawType>;
  };
};
