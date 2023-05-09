import { Box } from "@chakra-ui/react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import Editor from "ckeditor5-custom-build/build/ckeditor";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";

import { usePostFileQuery } from "@/react-query/hooks/useFileQuery";
import { modifyPostState, writePostState } from "@/store";

export const WritingEditor = ({
  title,
  contents,
  isModified,
}: {
  title: string;
  contents: string;
  isModified: boolean;
}) => {
  const [editorData, setEditorData] = useState<string>("");
  const [writePost, setWritePost] = useRecoilState(writePostState);
  const [modifyPost, setModifyPost] = useRecoilState(modifyPostState);

  const { mutate, data: resData, error } = usePostFileQuery();

  useEffect(() => {
    setEditorData(`<h1>${title}</h1>` + contents);
  }, [title, contents]);

  const customUploadAdapter = (loader: any) => {
    return {
      upload: () => {
        return new Promise((resolve, reject) => {
          const data = new FormData();

          loader.file.then((file: File) => {
            data.append("files", file);

            mutate(data, {
              onSuccess: (data) => {
                resolve({
                  default: `${process.env.REACT_APP_API_ENDPOINT}${data?.fileMetaDataList[0].url}`,
                });
              },
              onError: (error) => {
                reject(error);
              },
            });
          });
        });
      },
    };
  };

  const uploadPlugin = function (editor: any) {
    editor.plugins.get("FileRepository").createUploadAdapter = (
      loader: any
    ) => {
      return customUploadAdapter(loader);
    };
  };

  const editorConfiguration = {
    fontSize: {
      options: [
        6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 24, 30, 32,
      ],
    },
    extraPlugins: [uploadPlugin],
  };

  return (
    <Box maxW="100%" m="0 auto">
      <CKEditor
        editor={Editor}
        config={editorConfiguration}
        data={editorData}
        onReady={(editor: any) => {
          editor.editing.view.change((writer: any) => {
            writer.setStyle(
              "height",
              "500px",
              editor.editing.view.document.getRoot()
            );
          });
        }}
        onChange={(event: any, editor: any) => {
          const data = editor.getData();
          const match = data.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
          const title = match ? match[1] : "";
          const body = data.replace(match && match[0], "");

          setEditorData(data);

          console.log(data);

          if (!isModified) {
            setWritePost({
              ...writePost,
              title: title,
              contents: body,
            });
          } else {
            setModifyPost({
              ...modifyPost,
              title: title,
              contents: body,
            });
          }
        }}
      />
    </Box>
  );
};
