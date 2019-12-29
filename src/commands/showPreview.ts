import { Uri, ViewColumn, window, workspace } from "vscode";
import { DEFAULT_FILTER, spawnJq, stringifyCommand } from "../jq";

const showPreview = (queries: WeakMap<Uri, any>) => async (uri: Uri) => {
  if (!window.activeTextEditor) {
    return; // no editor
  }
  const {
    document: { fileName, languageId, uri: documentUri },
  } = window.activeTextEditor;
  let jqCommand;

  if (languageId !== "json") {
    return;
  } // not a json file
  const config = workspace.getConfiguration("jq");

  if (queries.has(uri)) {
    jqCommand = queries.get(uri);
  } else {
    jqCommand = await window.showInputBox({
      placeHolder: DEFAULT_FILTER,
    });
    queries.set(documentUri, jqCommand);
  }
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
