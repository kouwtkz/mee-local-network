import { useEffect, useMemo, useState } from "react";
import { StorageDataStateClass as SdsClass } from "#/functions/storage/StorageDataStateClass";
import { CreateState, CreateStateFunctionType } from "./CreateState";
import { useParams } from "react-router-dom";

export const threadLabeledList: {
  name: string;
  label?: string;
  order?: OrderByType;
  postable?: boolean;
  usePosts: CreateStateFunctionType<MeeLoguePostType[] | undefined>;
  object: SdsClass<MeeLoguePostRawType>;
}[] = [
  {
    name: "",
    label: "メイン",
    usePosts: CreateState(),
    object: new SdsClass({
      key: "main",
      src: "/logue/api/get/posts",
      version: "1.0",
      preLoad: true,
      lastmodField: "updatedAt",
    }),
  },
  {
    name: "old",
    label: "過去",
    order: "asc",
    postable: false,
    usePosts: CreateState(),
    object: new SdsClass({
      key: "old",
      src: "/logue/api/get/posts/old",
      version: "1.0",
      preLoad: true,
      lastmodField: "updatedAt",
    }),
  },
];

export function DataState() {
  function SdsClassSetData<T extends object>(dataObject: SdsClass<T>) {
    const [load, setLoad] = dataObject.useLoad();
    const setData = dataObject.useData()[1];
    useEffect(() => {
      if (load) {
        dataObject
          .fetchData({
            loadValue: load,
          })
          .then((data) => {
            dataObject.setData({
              data,
              setState: setData,
            });
          });
        setLoad(false);
      }
    }, [load, setLoad, setData]);
  }

  const currentName = useParams().name ?? "";
  const current = useMemo(() => {
    return threadLabeledList.find(({ name }) => name == currentName);
  }, [currentName, threadLabeledList]);
  const currentObject = current?.object;
  if (currentObject) SdsClassSetData(currentObject);

  return <></>;
}
