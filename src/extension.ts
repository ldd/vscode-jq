import {
  commands,
  ExtensionContext,
  QuickPickItem,
  Uri,
  workspace,
} from "vscode";
import showPreview from "./commands/showPreview";
import { JQProvider } from "./JQProvider";

export function activate({ subscriptions }: ExtensionContext) {
  const queries = new WeakMap<Uri, string>();
  const histories = new WeakMap<Uri, QuickPickItem[]>();

  // register a content provider for the jq-scheme
  const myScheme = "jq";
  const myProvider = new JQProvider();
  subscriptions.push(
    workspace.registerTextDocumentContentProvider(myScheme, myProvider)
  );

  // register a command that opens a jq-document
  subscriptions.push(
    commands.registerCommand("jq.showPreview", showPreview(queries, histories))
  );

  workspace.onDidSaveTextDocument((document) => {
    // only execute command on known documents
    if (!queries.has(document.uri)) return;
    commands.executeCommand("jq.showPreview", document.uri);
  });
  workspace.onDidCloseTextDocument((document) => {
    queries.delete(document.uri);
    // histories.delete(document.uri);
  });
}
