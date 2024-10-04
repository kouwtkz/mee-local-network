import { ToastContainer } from "react-toastify";
import { DataState, threadLabeledList } from "./DataState";
import { ThemeStateClass } from "./ThemeSetter";
import { useEffect, useMemo, useRef } from "react";
import { CreateState } from "./CreateState";
import { defaultToastContainerOptions } from "@/components/define/toastContainerDef";
import { ToastProgressState } from "./ToastProgress";
import { DarkThemeState } from "../theme";
import { useParams } from "react-router-dom";

export const useSiteIsFirst = CreateState(true);
export const useDataIsComplete = CreateState(false);
export const usePageIsComplete = CreateState(true);

export function StateSet() {
  const currentName = useParams().name ?? "";
  const current = useMemo(() => {
    return threadLabeledList.find(({ name }) => name == currentName);
  }, [currentName, threadLabeledList]);
  const isSetList = [];
  if (current) isSetList.push(Boolean(current.usePosts()[0]));
  return (
    <>
      <DataState />
      <ToastContainer {...defaultToastContainerOptions} />
      <ToastProgressState />
      <LoadingState isSetList={isSetList} />
      <DarkThemeState />
    </>
  );
}

const loadingCheckID = "Element_DateState_Loading_NotEnd";
const reloadFunction =
  process.env.NODE_ENV === "development"
    ? `setTimeout(() => {if (document.getElementById("${loadingCheckID}")) location.reload()}, 5000)`
    : "";

interface LoadingStateProps {
  children?: React.ReactNode;
  isSetList?: boolean[];
}
function LoadingState({ isSetList, children }: LoadingStateProps) {
  const fScrollY = useRef(window.scrollY);
  const [isFirst, setIsFirst] = useSiteIsFirst();
  const [dataIsComplete, setIsComplete] = useDataIsComplete();
  const [pageIsComplete, setPageIsComplete] = usePageIsComplete();
  const isComplete = useMemo(
    () => dataIsComplete && pageIsComplete,
    [dataIsComplete, pageIsComplete]
  );
  const isCompleteRef = useRef(false);
  const comp = useMemo(
    () => (isSetList ?? [true]).every((v) => v),
    [isSetList]
  );
  useEffect(() => {
    if (comp !== dataIsComplete) setIsComplete(comp);
  }, [comp, dataIsComplete]);
  useEffect(() => {
    isCompleteRef.current = isComplete;
  }, [isComplete]);
  useEffect(() => {
    document.body.classList.remove("dummy");
    setTimeout(() => {
      if (!isCompleteRef.current) {
        setIsComplete(true);
        setPageIsComplete(true);
      }
    }, 5000);
  }, []);
  useEffect(() => {
    const html = document.querySelector("html");
    if (html) {
      if (isComplete) {
        html.classList.remove("loading");
      } else {
        html.classList.add("loading");
      }
    }
  }, [isComplete]);
  useEffect(() => {
    if (isFirst && isComplete) {
      scrollTo({ top: fScrollY.current });
      setIsFirst(false);
    }
  }, [isComplete, isFirst]);
  return (
    <>
      {isComplete ? null : isFirst && reloadFunction ? (
        <>
          <script dangerouslySetInnerHTML={{ __html: reloadFunction }} />
          <div id={loadingCheckID} />
        </>
      ) : null}
      {children}
    </>
  );
}
