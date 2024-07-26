type logicalConditionsType = "AND" | "OR";
type filterConditionsType = "equals" | "gt" | "gte" | "lt" | "lte" | "not" | "in";
type filterConditionsStringType = "contains" | "startsWith" | "endsWith";
type filterConditionsBoolType = "bool";
type filterConditionsAllType = filterConditionsType | filterConditionsStringType | filterConditionsBoolType;
type filterConditionsBoolStringKeyValue = { [C in filterConditionsStringType]?: string } | { [C in filterConditionsBoolType]?: boolean };
type filterConditionsAllKeyValue<T> = { [C in filterConditionsType]?: T[K] } | filterConditionsBoolStringKeyValue;
type objectSubmitDataType<T> = { [K in keyof T]?: T[K] | filterConditionsAllKeyValue<T> }
type findWhereType<T> = { [K in logicalConditionsType]?: (findWhereType<T> | objectSubmitDataType<T>)[] } | objectSubmitDataType<T>
// includeは無理…それ以外を再現した
type findManyProps<T> = {
  list?: T[],
  where?: findWhereType<T>;
  take?: number,
  skip?: number,
  orderBy?: { [K in keyof T]?: OrderByType }[],
  include?: any
}
type OrderByType = "asc" | "desc";
type OrderByItem = { [k: string]: OrderByType };

interface WhereOptionsType<T> {
  [k: string]: string
  | findWhereFunction
  | { key?: string, hidden?: boolean };
}
