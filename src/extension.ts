import { commands, ExtensionContext, Uri, workspace } from "vscode";
import showPreview from "./commands/showPreview";
import { JQProvider } from "./JQProvider";

export function activate({ subscriptions }: ExtensionContext) {
  const queries = new WeakMap<Uri, string>();

  // register a content provider for the jq-scheme
  const myScheme = "jq";
  const myProvider = new JQProvider();
  subscriptions.push(
    workspace.registerTextDocumentContentProvider(myScheme, myProvider)
  );

  // register a command that opens a jq-document
  subscriptions.push(
    commands.registerCommand("jq.showPreview", showPreview(queries))
  );

  workspace.onDidSaveTextDocument(document => {
    commands.executeCommand("jq.showPreview", document.uri);
  });
  workspace.onDidCloseTextDocument(document => {
    queries.delete(document.uri);
  });
}
