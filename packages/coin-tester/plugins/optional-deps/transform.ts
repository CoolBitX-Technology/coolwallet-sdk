import { Identifier } from '@babel/types';
import type { PluginObj } from '@babel/core';

function OptionalDepsTransform(enabledPackages: string[]): PluginObj {
  const relativePaths = enabledPackages.map((k) => `.${k.startsWith('@coolwallet') ? k.slice(11) : k}`);
  const prepareToRemoveIdentifiers: Identifier[] = [];
  return {
    name: 'optional-deps',
    visitor: {
      ImportDeclaration(src) {
        if (!relativePaths.includes(src.node.source.value) && src.node.specifiers.length === 1) {
          prepareToRemoveIdentifiers.push(src.node.specifiers[0].local);
          src.remove();
        }
      },
      ObjectExpression(src) {
        const properties = src.node.properties;
        for (const ident of prepareToRemoveIdentifiers) {
          const identNode = properties.find((p) => {
            if (p.type === 'ObjectProperty' && p.value.type === 'Identifier') {
              return ident.name === p.value.name;
            }
            return false;
          });
          if (identNode !== undefined) {
            src.remove();
          }
        }
      },
    },
  };
}

export default OptionalDepsTransform;
