import BetterSqlite3 from "better-sqlite3";

function whereToSql<T = any>(where: findWhereType<T>) {
  const bind: any[] = [];
  function recursion(__where: findWhereType<T>): string {
    return Object.entries(__where).map(([fkey, fval]) => {
      const field = "`" + fkey + "`";
      const fvalWheres: findWhereType<T>[] = fval;
      switch (fkey) {
        case "AND":
        case "OR":
        case "NOT":
          return fvalWheres.map((_val) => recursion(_val)).filter(v => v).join(` ${fkey} `);
        default:
          if (typeof fval === "object") {
            const _conditions: [any, any][] = Object.entries(fval);
            const conditions: [filterConditionsAllType, any][] = _conditions;
            return conditions.map(([k, v]) => {
              if (typeof v === "object" && "test" in v) {
                bind.push((v as RegExp).source);
                return `${field} regexp ?`;
              } else if (v === null) {
                return `${k === "not" ? "NOT " : ""}ISNULL(${field})`;
              }
              switch (k) {
                case "not":
                  bind.push(v);
                  return `${field} <> ?`;
                case "contains":
                  bind.push(`%${v}%`);
                  return `${field} LIKE ?`;
                case "startsWith":
                  bind.push(`%${v}`);
                  return `${field} LIKE ?`;
                case "endsWith":
                  bind.push(`${v}%`);
                  return `${field} LIKE ?`;
                case "gt":
                  bind.push(v);
                  return `${field} > ?`;
                case "gte":
                  bind.push(v);
                  return `${field} >= ?`;
                case "lt":
                  bind.push(v);
                  return `${field} < ?`;
                case "lte":
                  bind.push(v);
                  return `${field} <= ?`;
                case "equals":
                default:
                  bind.push(v);
                  return `${field} = ?`;
              }
            });
          } else {
            bind.push(fval);
            return `${field} = ?`;
          }
      }
    }).join(" ");
  }
  const whereString = recursion(where);
  return { where: whereString ? " WHERE " + whereString : "", bind };
}

export class MeeSqlite {
  db: BetterSqlite3.Database;
  constructor(path: string, options?: BetterSqlite3.Options) {
    this.db = new BetterSqlite3(path, options);
  }
  dispose() {
    this.db.close();
  }
  sqlWhere<T>(where?: findWhereType<T>) {
    const sqlObject = where ? whereToSql<T>(where) : null;
    let sql = "";
    if (sqlObject?.where) sql = sql + sqlObject.where;
    return { sql, bind: sqlObject?.bind }
  }
  async select<T>({ params = "*", table, orderBy, where, take, skip }: selectProps<T>) {
    const param = (Array.isArray(params) ? params : [params])
      .map(f => {
        const field = String(f);
        return field === "*" || /[\("']/.test(field) ? field : ("`" + field + "`")
      }).join(", ");
    let { sql, bind } = this.sqlWhere(where);
    sql = "SELECT " + param + " FROM `" + table + "`" + sql;
    if (orderBy) {
      const orderByList =
        (Array.isArray(orderBy) ? orderBy : [orderBy])
          ?.reduce((a, c) => {
            Object.entries(c).forEach(([k, v]) => {
              if (a.findIndex((f) => k in f) < 0) {
                if (c) a.push({ [k]: v as OrderByType });
              }
            });
            return a;
          }, [] as { [k: string]: OrderByType }[]);
      if (orderByList.length) {
        sql = sql + " ORDER BY "
          + orderByList.map(e => {
            const [k, v] = Object.entries(e)[0];
            return "`" + k + "` " + v.toUpperCase();
          }).join(", ");
      }
    }
    if (take) sql = sql + " LIMIT " + take + (skip ? (" OFFSET " + skip) : "");
    const stmt = this.db.prepare<T[], T>(sql);
    if (bind) stmt.bind(...bind);
    return stmt.all();
  }
  async insert<T extends Object>({ table, entry = {} as T, rawEntry = {} as T }: InsertProps<T>) {
    const entries = Object.entries(entry);
    const rawEntries = Object.entries(rawEntry);
    let sql = "INSERT INTO `" + table + "`(" + entries.map((v) => "`" + v[0] + "`")
      .concat(rawEntries.map((v) => "`" + v[0] + "`")).join(", ") + ")"
      + ` VALUES(${entries.map(() => "?").concat(rawEntries.map((v) => v[1])).join(", ")})`;
    const stmt = this.db.prepare(sql);
    stmt.bind(...entries.map((v) => v[1]));
    return stmt.run();
  }
  async update<T extends Object>({ table, entry = {} as T, rawEntry = {} as T, where, take, skip }: updateProps<T>) {
    const entries = Object.entries(entry);
    const rawEntries = Object.entries(rawEntry).map((v) => "`" + v[0] + "` = " + v[1]);
    let sql = "UPDATE `" + table + "` SET " + entries.map((v) => "`" + v[0] + "` = ?").concat(rawEntries).join(", ");
    const { sql: whereSql, bind } = this.sqlWhere(where);
    if (whereSql) sql = sql + whereSql;
    if (take) sql = sql + " LIMIT " + take + (skip ? (" OFFSET " + skip) : "");
    const stmt = this.db.prepare(sql);
    stmt.bind(...(entries.map((v) => v[1]).concat(bind)));
    return stmt.run();
  }
  async delete<T>({ table, where, take, skip }: deleteProps<T>) {
    let { sql, bind } = this.sqlWhere(where);
    sql = "DELETE FROM `" + table + "`" + sql;
    if (take) sql = sql + " LIMIT " + take + (skip ? (" OFFSET " + skip) : "");
    const stmt = this.db.prepare(sql);
    if (bind) stmt.bind(...bind);
    return stmt.run();
  }
  static isoFormat(time = "'now'") { return `strftime('%Y-%m-%dT%H:%M:%fZ', ${time})` };
  async createTable<T = any>({ table, notExists, entry }: createProps<T>) {
    const bind: any[] = [];
    let sql = "CREATE TABLE";
    if (notExists) sql = sql + " IF NOT EXISTS";
    sql = sql + " `" + table + "`("
      + Object.entries(entry).map(([k, _v]) => {
        const v = _v as createTableEntryItemType;
        let sql = "`" + k + "`";
        const defaultTypeof = typeof v.default;
        let fieldType: sqliteValueType | undefined = v.type;
        if (typeof fieldType === "undefined") {
          switch (defaultTypeof) {
            case "string":
              fieldType = "TEXT";
              break;
            case "number":
              fieldType = "NUMERIC";
              break;
            case "boolean":
            case "bigint":
              fieldType = "INTEGER";
              break;
            default:
              if (v.createAt) fieldType = "TEXT";
              else fieldType = "";
          }
        }
        if (fieldType) sql = sql + " " + fieldType;
        if (v.primary) sql = sql + " PRIMARY KEY";
        if (v.createAt) {
          sql = sql + " NOT NULL DEFAULT (" + MeeSqlite.isoFormat() + ")";
        } else {
          if (v.notNull) sql = sql + " NOT NULL";
          if (v.unique) sql = sql + " UNIQUE";
          if (defaultTypeof !== "undefined") {
            sql = sql + " DEFAULT " + (fieldType === "TEXT" ? `'${v.default}'` : v.default);
          }
        }
        return sql;
      }).join(", ")
      + ")";
    const stmt = this.db.prepare(sql);
    if (bind.length > 0) stmt.bind(...bind);
    return stmt.run();
  }
  async dropTable(table: string) {
    this.db.exec("DROP TABLE `" + table + "`");
  }
  begin() {
    this.db.exec("BEGIN");
  }
  commit() {
    this.db.exec("COMMIT");
  }
  rollback() {
    this.db.exec("ROLLBACK");
  }
}
