interface sqlWhereProps<T = any> {
  where?: findWhereType<T>;
  take?: number,
  skip?: number,
};

interface selectProps<T = any> extends sqlWhereProps<T> {
  table: string;
  params?: "*" | keyof T | (keyof T)[];
  orderBy?: OrderByItem<T> | OrderByItem<T>[];
};

interface InsertProps<T = any> {
  table: string;
  entry: T,
};

interface updateProps<T = any> extends sqlWhereProps<T> {
  table: string;
  entry: T,
};

interface deleteProps<T = any> extends sqlWhereProps<T> {
  table: string;
};

type sqliteValueType = "TEXT" | "NUM" | "INT" | "REAL" | "";
type createTableEntryType<T = any> = {
  [k in keyof T]: {
    default?: any;
    type?: sqliteValueType;
    primary?: boolean;
    unique?: boolean;
    notNull?: boolean;
  }
}
interface createProps<T = any> {
  table: string;
  entry: createTableEntryType;
};
