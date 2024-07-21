interface ThreadsRawType {
  id: number;
  name?: string;
  text?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ThreadType extends ThreadsRawType {
  date?: Date;
  update?: Date;
}

interface ThreadsDataType {
  length: number;
  take?: number;
  threads: ThreadType[];
}

interface ThreadsRawDataType extends Omit<ThreadsDataType, "threads"> {
  threads: ThreadsRawType[];
}

