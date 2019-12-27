import { EventEmitter, TextDocumentContentProvider, Uri } from "vscode";

export class JQProvider implements TextDocumentContentProvider {
  // emitter and its event
  public onDidChangeEmitter = new EventEmitter<Uri>();
  public onDidChange = this.onDidChangeEmitter.event;

  public provideTextDocumentContent(uri: Uri): string {
    return uri.query;
  }
}
