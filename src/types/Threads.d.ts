interface ThreadType {
  id: number;
  name?: string;
  text?: string;
  date?: Date;
}

interface ThreadsDataType {
  length: number;
  limit: number;
  threads: ThreadType[];
}

interface ThreadsRawType extends Omit<ThreadType, "date"> {
  createdAt?: string;
  updatedAt?: string;
}

interface ThreadsResponseType extends Omit<ThreadsDataType, "threads"> {
  threads: ThreadsRawType[];
}

