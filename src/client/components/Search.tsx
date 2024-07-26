import { useEffect, useMemo, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { MdArrowBackIosNew, MdArrowForwardIos } from "react-icons/md";
import { useSearchParams } from "react-router-dom";

export function SearchArea({ maxPage = 1 }: { maxPage?: number }) {
  const [search, setSearch] = useSearchParams();
  const refInput = useRef<HTMLInputElement>(null);
  const p = useMemo(() => Number(search.get("p") ?? 1), [search]);
  const q = useMemo(() => search.get("q") ?? "", [search]);
  useHotkeys(
    "escape",
    (e) => {
      if (document.activeElement === refInput.current) {
        refInput.current?.blur();
        e.preventDefault();
      }
    },
    { enableOnFormTags: ["INPUT"] }
  );
  useHotkeys("slash", (e) => {
    refInput.current?.focus();
    e.preventDefault();
  });
  useHotkeys("o", (e) => {
    paging(-1);
    e.preventDefault();
  });
  useHotkeys("p", (e) => {
    paging(1);
    e.preventDefault();
  });
  function paging(go: number) {
    let np = p + go;
    if (np > maxPage) np = maxPage;
    if (np < 1) np = 1;
    if (np !== p) {
      const searchObject: { [k: string]: string } = {
        ...Object.fromEntries(search),
        p: np.toString(),
      };
      if (searchObject.p === "1") delete searchObject.p;
      setSearch(searchObject, { preventScrollReset: false });
    }
  }
  useEffect(() => {
    if (refInput.current) refInput.current.value = q;
  }, [q]);
  return (
    <div className="search">
      <div className="list">
        <form
          className="search"
          method="get"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            const nq = (e.target as HTMLFormElement).q.value;
            if (nq !== q) {
              if (nq) setSearch({ q: nq });
              else setSearch();
            }
          }}
        >
          <input
            type="search"
            title="検索"
            name="q"
            ref={refInput}
            placeholder="キーワード検索"
            defaultValue={q}
          />
          <button type="submit" className="submit button">
            検索
          </button>
        </form>
        <div className="paging">
          <button
            type="button"
            className="left"
            title="前のページに戻る"
            disabled={p <= 1}
            onClick={() => paging(-1)}
            onContextMenu={(e) => {
              e.preventDefault();
              paging(-1e6);
            }}
          >
            <MdArrowBackIosNew />
          </button>
          <button
            type="button"
            className="right"
            title="次のページに進む"
            disabled={p >= maxPage}
            onClick={() => paging(1)}
            onContextMenu={(e) => {
              e.preventDefault();
              paging(1e6);
            }}
          >
            <MdArrowForwardIos />
          </button>
        </div>
      </div>
    </div>
  );
}
