import * as ts from 'typescript';

const TARGET = 'script';

function GetScripts(sourceFile: ts.SourceFile): string[] {
  const scripts: string[] = [];
  function searchScriptTag(node: ts.Node) {
    if (ts.isPropertyAssignment(node)) {
      const identifier = node.name as ts.Identifier;
      if (identifier.escapedText === TARGET && ts.isNoSubstitutionTemplateLiteral(node.initializer)) {
        scripts.push(node.initializer.text);
      }
    }

    ts.forEachChild(node, searchScriptTag);
  }

  searchScriptTag(sourceFile);
  return scripts;
}

export default GetScripts;
