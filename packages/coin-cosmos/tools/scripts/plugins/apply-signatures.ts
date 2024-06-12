import * as ts from 'typescript';

const TARGET = 'signature';

class Signer {
  private pivot = 0;
  constructor(private signatures: string[]) {}

  sign(): string {
    const signature = this.signatures[this.pivot];
    this.pivot += 1;
    return signature;
  }
}

const applySignatures: (signer: Signer) => ts.TransformerFactory<ts.SourceFile> = (signer) => (context) => {
  return (sourceFile) => {
    const visitor: ts.Visitor = (node) => {
      if (ts.isPropertyAssignment(node)) {
        const identifier = node.name as ts.Identifier;
        if (identifier.escapedText === TARGET) {
          const signature = signer.sign();
          return context.factory.createPropertyAssignment(
            ts.factory.createIdentifier(TARGET),
            ts.factory.createNoSubstitutionTemplateLiteral(signature)
          );
        }
      }
      return ts.visitEachChild(node, visitor, context);
    };
    return ts.visitNode(sourceFile, visitor);
  };
};

export { applySignatures, Signer };
