import BetterSqlite3 from "better-sqlite3";
import { MeeSqlClass } from "./MeeSqlClass";

export class MeeSqlite extends MeeSqlClass<BetterSqlite3.Database> {
  constructor(path: string, options?: BetterSqlite3.Options) {
    super(new BetterSqlite3(path, options));
  }
  dispose() {
    this.db.close();
  }
  override async select<K>(args: MeeSqlSelectProps<K>): Promise<K[]> {
    return await super.select(args) as K[];
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
