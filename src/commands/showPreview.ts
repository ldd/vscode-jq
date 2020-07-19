import { QuickPickItem, Uri, ViewColumn, window, workspace } from "vscode";
import { spawnJq, stringifyCommand } from "../jq";

const initialChoices = ["."];
const generateItems = () => initialChoices.map((label) => ({ label }));

async function pickFilter(uri: Uri, histories: WeakMap<Uri, QuickPickItem[]>) {
  try {
    return await new Promise<string>((resolve, reject) => {
      const input = window.createQuickPick<QuickPickItem>();
      input.placeholder = "Type a new command or select one from your history";
      input.items = histories.get(uri) ?? generateItems();

      let label = "";
      input.onDidChangeValue((newText) => (label = newText));

      input.onDidAccept(() => {
        // if the user selects a new command, add it to our histories map
        // if the history map is empty, for whatever reason, we fill it too
        const { selectedItems } = input;
        const newHistory = [...input.items];
        if (selectedItems.length < 1) newHistory.push({ label });
        histories.set(uri, newHistory);

        resolve(selectedItems[0]?.label ?? label);
        input.dispose();
      });
      input.show();
    });
  } finally {
    // we can probably reset history for this uri here if we absolutely do not want to keep it
  }
}

const showPreview = (
  queries: WeakMap<Uri, string>,
  histories: WeakMap<Uri, QuickPickItem[]>
) => async (uri: Uri) => {
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
    // better QuickPick with history suggestion inspired by this issue: https://github.com/microsoft/vscode/issues/426
    jqCommand = await pickFilter(documentUri, histories);
    queries.set(documentUri, jqCommand);
  }

  // jqCommand could be undefined for a number of reasons, we exit early to avoid trouble
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
