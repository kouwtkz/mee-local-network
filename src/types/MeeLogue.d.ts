interface MeeLoguePostRawType {
  id: number;
  name?: string;
  text?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MeeLoguePostType extends MeeLoguePostRawType {
  date?: Date;
  update?: Date;
}

interface MeeLogueDataType {
  length: number;
  take?: number;
  posts: MeeLoguePostType[];
}

interface MeeLogueRawDataType extends Omit<MeeLogueDataType, "posts"> {
  posts: MeeLoguePostRawType[];
}

