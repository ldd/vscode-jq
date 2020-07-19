import { Uri, ViewColumn, window, workspace } from "vscode";
import { DEFAULT_FILTER, spawnJq, stringifyCommand } from "../jq";

const showPreview = (queries: WeakMap<Uri, any>) => async (uri: Uri) => {
  if (!window.activeTextEditor) return;

  const { document } = window.activeTextEditor;
  const { fileName, languageId, uri: documentUri } = document;

  const config = workspace.getConfiguration("jq");
  const { strictMode, validLanguageIdentifiers = [] } = config;

  // strict mode requires our document languageId to be part of validLanguageIdentifiers
  // you can technically configurate this using fileAssociations, but there may be reasons for users to bypass this check
  // see https://github.com/ldd/vscode-jq/issues/17
  if (strictMode && languageId !== "json") return;

  let jqCommand: string | undefined;
  if (queries.has(uri)) {
    jqCommand = queries.get(uri);
  } else {
    jqCommand = await window.showInputBox({
      placeHolder: DEFAULT_FILTER,
    });
    queries.set(documentUri, jqCommand);
  }

  // showInputBox returns undefined if the input box was canceled
  // exit early when that happens
  if (jqCommand === undefined) return;

  const query = await spawnJq(jqCommand, fileName, config);
  if (query) {
    const name = stringifyCommand(jqCommand);
    const previewUri = Uri.parse(`jq:${name}.json`).with({ query });
    const doc = await workspace.openTextDocument(previewUri); // calls back into the provider
    await window.showTextDocument(doc, {
      preserveFocus: true,
      preview: true,
      viewColumn: ViewColumn.Beside,
    });
  }
};

export default showPreview;
