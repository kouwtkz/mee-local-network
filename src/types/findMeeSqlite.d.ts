interface selectProps<T = any> {
  table: string;
  params?: "*" | keyof T | (keyof T)[];
  where?: findWhereType<T>;
  orderBy?: OrderByItem<T> | OrderByItem<T>[];
  take?: number,
  skip?: number,
};

interface InsertProps<T = any> {
  table: string;
  entry?: T,
  rawEntry?: T,
};

interface updateProps<T = any> {
  table: string;
  entry?: T,
  rawEntry?: T,
  where?: findWhereType<T>;
  take?: number,
  skip?: number,
};

interface deleteProps<T = any> {
  table: string;
  where?: findWhereType<T>;
  take?: number,
  skip?: number,
};

type sqliteValueType = "TEXT" | "NUMERIC" | "INTEGER" | "REAL" | "";
interface createTableEntryItemType {
  default?: any;
  type?: sqliteValueType;
  primary?: boolean;
  unique?: boolean;
  notNull?: boolean;
  createAt?: boolean;
}
type createTableEntryType<T = any> = {
  [k in keyof T]: createTableEntryItemType
}
interface createProps<T = any> {
  table: string;
  notExists?: boolean;
  entry: createTableEntryType<T>;
};
